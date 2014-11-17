#pragma strict

import System.Collections.Generic;
import System.Linq;

/*
 * All settings tuned against terrain size 2000 x 2000 x 100.
 */

// LineRenderer game object prefab
var LinePrefab : GameObject;

var RiverLength : int = 1000;

@Range(0, 45)
var StepMax : float = 1f;
@Range(0, 45)
var StepMin : float = 0f;

@Range(0, 1)
var Stickiness : float = 0f;

var RiverFiles : List.<TextAsset>;

private var currentRiver : River;
private var rivers : List.<River>;
private var renderers : List.<GameObject>;

private var flyRiver : River = null;
private var flyLastIdx : int = 0;
private var flyTimer : float = 0f;
private var cameraOriginPosition : Vector3;
private var cameraOriginRotation : Quaternion;

private var riverTerrain : Terrain;
private var originalHeightMap : float[,] = null;

// Add a button to the editor to sort the river file list by name.
@CustomEditor (RiverGenerator)
class RiverGeneratorFileSorter extends Editor {
	function OnInspectorGUI () {
		DrawDefaultInspector();
		if (GUILayout.Button("Sort by name")) {
			var currentTarget = target as RiverGenerator;
			currentTarget.RiverFiles = currentTarget.RiverFiles.OrderBy(function(x) { return x.name; }).ToList();
		}
	}

	function compareNames(a : TextAsset, b : TextAsset) : int {
		return a.name.CompareTo(b.name);
	}
}

function Start () {
	rivers = new List.<River>();
	renderers = new List.<GameObject>();
	cameraOriginPosition = Camera.main.transform.position;
	cameraOriginRotation = Camera.main.transform.rotation;
	
	riverTerrain = Terrain.activeTerrain; //GameObject.Find("RiverTerrain").GetComponent.<Terrain>();
	SaveTerrain();
	
	Debug.Log("N - New River");
	Debug.Log("R - Regenerate current river");
	Debug.Log("F - Flyover current river");
	Debug.Log("E - Export");
	Debug.Log("I - Import files specified in editor");
	Debug.Log("Delete - Delete selected river");
	Debug.Log("[ - Previous river");
	Debug.Log("] - Next river");
}

function Update () {
	if (Input.GetKeyDown(KeyCode.N)) {
		MakeRiver();
	} else if (Input.GetKeyDown(KeyCode.R)) {
		currentRiver.Regenerate();
	} else if (Input.GetKeyDown(KeyCode.F)) {
		Flyover(currentRiver);
	} else if (Input.GetKeyDown(KeyCode.E)) {
		ExportRiver(currentRiver);
	} else if (Input.GetKeyDown(KeyCode.Delete)) {
		DeleteRiver(currentRiver);
	} else if (Input.GetKeyDown(KeyCode.LeftBracket)) {
		SwitchRiver(-1);
	} else if (Input.GetKeyDown(KeyCode.RightBracket)) {
		SwitchRiver(1);
	}
	
	if (flyRiver != null) {
		flyTimer += Time.deltaTime;
		if (flyTimer > 0.01) {
			flyLastIdx = flyLastIdx + 1;
			flyTimer = 0f;
			if (flyLastIdx >= flyRiver.points.Count) {
				Camera.main.transform.position = cameraOriginPosition;
				Camera.main.transform.rotation = cameraOriginRotation;
				flyRiver = null;
				flyLastIdx = 0;
				flyTimer = 0;
			} else {
				var camIdx = Mathf.Max(flyLastIdx - 60, 0);
				Camera.main.transform.position = flyRiver.points[camIdx];
				Camera.main.transform.position.y = 200;
				Camera.main.transform.LookAt(flyRiver.points[flyLastIdx] + Vector3(0,60,0));
			}
		}
	}
}

function OnApplicationQuit() {
	RestoreTerrain();
}

function SaveTerrain() {
	Debug.Log("save!");
	var tData = riverTerrain.terrainData;
	originalHeightMap = tData.GetHeights(0, 0, tData.heightmapWidth, tData.heightmapHeight);
}

function RestoreTerrain() {
	Debug.Log("restore!");
	if (originalHeightMap != null) {
		riverTerrain.terrainData.SetHeights(0, 0, originalHeightMap);
	}
}

function SwitchRiver(incr : int) {
	var oldIdx = rivers.IndexOf(currentRiver);
	var newIdx = oldIdx + incr;
	if (newIdx < 0) newIdx = rivers.Count - 1;
	if (newIdx >= rivers.Count) newIdx = 0;
	RestoreTerrain();
	Blur(renderers[oldIdx]);
	currentRiver = rivers[newIdx];
	Focus(renderers[newIdx]);
	SinkTerrain();
}

function Flyover(river : River) {
	flyRiver = river;
}

function Focus(river : GameObject) {
	river.renderer.material.color = Color.yellow;
}

function Blur(river : GameObject) {
	river.renderer.material.color = Color.grey;
}

function MakeRiver() {
	// Read settings
	// Plot points
	// Draw lines?
//	var r : River = ScriptableObject.CreateInstance.<River>();
	var r = new River(StepMin, StepMax, Stickiness, RiverLength);
	r.Generate();
	rivers.Add(r);
	
	var riverBounds = r.ToBoundingBox();
//	var lineView = Instantiate(LinePrefab, Vector3.zero, Quaternion.identity);
	var lineView = InstantiateRenderer(r, LinePrefab);
	renderers.Add(lineView);

	if (currentRiver != null) {
		Blur(renderers[rivers.IndexOf(currentRiver)]);
	}
	Focus(renderers[renderers.Count - 1]);

	currentRiver = r;
	
	RestoreTerrain();
	SinkTerrain();
}

function DeleteRiver(river : River) {
	SwitchRiver(1);
	
	// If there's only one river, switching will have no effect. Unset current river ref.
	if (river == currentRiver) {
		RestoreTerrain();
		currentRiver = null;
	}

	for (var i = 0; i < rivers.Count; i++) {
		if (rivers[i] == river) {
			rivers.RemoveAt(i);
			Destroy(renderers[i]);
			renderers.RemoveAt(i);
			break;
		}
	}
}

function ExportRiver(river : River) {
	 var riverJSON = river.ToJSON();
	 var timestamp = System.DateTime.Now.ToString("yyyyMMdd-HHmmss");
	 var riverPath = "Assets/Resources/river-" + timestamp + ".json";
	 System.IO.File.WriteAllText(riverPath, riverJSON);
	 Debug.Log("River saved to: " + riverPath);
}

function SinkTerrain() {
	var riverBoundingBox = currentRiver.ToBoundingBox();
	var tData = riverTerrain.terrainData;
	var tPos = riverTerrain.transform.position;
	var tSize = tData.size;
	var tCenter = tPos + tSize / 2;
	var i : int;
	var valX : int;
	var valY : int;

		Debug.Log("sink!");

	// Center the mass of river points over the terrain patch.
	for (i = 0; i < currentRiver.points.Count; i++) {
		currentRiver.points[i] += tCenter - riverBoundingBox.center;
	}
	
	// Move the line preview to match.
	var renderIdx = rivers.IndexOf(currentRiver);
	var oldView = renderers[renderIdx];
	renderers[renderIdx] = InstantiateRenderer(currentRiver, LinePrefab);
	Destroy(oldView);

	var startBrush = MakeCircleBrush(30, 0.9, 1.0); // matrix size, inner val, outer val
	var startPoints = CircleAround(currentRiver.points.First(), 20, 24); // center, radius, point count
	var finishPoints = CircleAround(currentRiver.points.Last(), 20, 24);
	
	var valleyBrushSize = 50;
	var valleyBrush : float[,] = new float[valleyBrushSize, valleyBrushSize];
	
	for (valY = 0; valY < valleyBrushSize; valY++) {
		for (valX = 0; valX < valleyBrushSize; valX++) {
			if (valY > valleyBrushSize * 0.3 && valY < valleyBrushSize * 0.6
			 && valX > valleyBrushSize * 0.3 && valX < valleyBrushSize * 0.6) {
				valleyBrush[valY, valX] = 0.985;
			} else {
				valleyBrush[valY, valX] = 0.995;
			}
		}
	}
	
	// Can't initialize a float[,] so create a float[][] and copy it by hand. THIS SUCKS.
	var riverBrush : float[,] = new float[10,10];
	var jagged = [
        [1.0,1.0,.95,.95,.95,.95,.95,.95,1.0,1.0],
        [1.0,.95,.9,.9,.9,.9,.9,.9,.95,1.0],
        [.95,.9,.85,.85,.85,.85,.85,.85,.9,.95],
        [.95,.9,.85,.6,.6,.6,.6,.85,.9,.95],
        [.95,.9,.85,.6,0,0,.6,.85,.9,.95],
        [.95,.9,.85,.6,0,0,.6,.85,.9,.95],
        [.95,.9,.85,.6,.6,.6,.6,.85,.9,.95],
        [.95,.9,.85,.85,.85,.85,.85,.85,.9,.95],
        [1.0,.95,.9,.9,.9,.9,.9,.9,.95,1.0],
        [1.0,1.0,.95,.95,.95,.95,.95,.95,1.0,1.0]
	];

	for (var y = 0; y < 10; y++) {
		for (var x = 0; x < 10; x++) {
			riverBrush[x, y] = jagged[y][x];	
		}
	}
	
	ApplyBrush(valleyBrush, riverTerrain, currentRiver.points);
	ApplyBrush(riverBrush, riverTerrain, currentRiver.points);
	ApplyBrush(startBrush, riverTerrain, startPoints);
	ApplyBrush(startBrush, riverTerrain, finishPoints);
}

function ApplyBrush(brush : float[,], terrain : Terrain, points : List.<Vector3> ) {
	var tData = terrain.terrainData;
	var xResolution : int = tData.heightmapWidth;
	var zResolution : int = tData.heightmapHeight;
	var heights = tData.GetHeights(0,0,xResolution,zResolution);

	for (var i = 0; i < points.Count; i++) {
		var point = points[i];
		var terX : int = ((point.x / tData.size.x) * xResolution) - brush.GetLength(0) / 2;
		var terZ : int = ((point.z / tData.size.z) * zResolution) - brush.GetLength(1) / 2;

		for (var z = 0; z < brush.GetLength(1); z++) {
			for (var x = 0; x < brush.GetLength(0); x++) {
//				Debug.Log("" + (terZ + z) + (terX + x) + x + z);
				heights[terZ + z, terX + x] *= brush[x,z];
			}
		}
	}
	
	tData.SetHeights(0,0, heights);
}

function MakeCircleBrush(brushSize : int, innerVal : float, outerVal : float) : float[,] {
	var brush : float[,] = new float[brushSize, brushSize];
	var range = outerVal - innerVal;
	
	for (var valY = 0; valY < brushSize; valY++) {
		var rowVal = 1 - Mathf.Sin(Mathf.PI * valY / parseFloat(brushSize));
		for (var valX = 0; valX < brushSize; valX++) {
			var colVal = 1 - Mathf.Sin(Mathf.PI * valX / parseFloat(brushSize));
			brush[valY, valX] = rowVal * colVal * range * 2 + innerVal;
			brush[valY, valX] = Mathf.Min(1.0, brush[valY, valX]);
//			Debug.Log(brush[valY, valX]);
		}
	}

	return brush;
}

// Returns a list of points in a circle around `point`.
function CircleAround(point : Vector3, radius: float, count : int) : List.<Vector3> {
	var points = new List.<Vector3>();
	var offset = Vector3.one * radius;
	
	for (var i = 0; i < count; i++) {
		offset = Quaternion.AngleAxis(i / parseFloat(count) * 360, Vector3.up) * offset;
		points.Add(point + offset);	
	}
	
	return points;
}

// http://answers.unity3d.com/questions/164257/find-the-average-of-10-vectors.html
function GetMeanVector(positions : List.<Vector3>) : Vector3 {
	if (positions.Count == 0)
		return Vector3.zero;
	
	var x : float = 0f;
	var y : float = 0f;
	var z : float= 0f;
	for (var pos in positions) {
		x += pos.x;
		y += pos.y;
		z += pos.z;
	}

	return Vector3(x / positions.Count, y / positions.Count, z / positions.Count);
}

function InstantiateRenderer(river : River, linePrefab : GameObject) {
	var points = river.points;
	var lineView = Instantiate(linePrefab, Vector3.zero, Quaternion.identity);	
	var renderer : LineRenderer = lineView.GetComponent.<LineRenderer>();
	renderer.SetVertexCount(points.Count);
	
	for (var i = 0; i < points.Count; i++) {
		renderer.SetPosition(i, Vector3(points[i].x, 100, points[i].z));
	}
	
	return lineView;
}


