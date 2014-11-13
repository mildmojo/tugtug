#pragma strict

import System.Collections.Generic;
import System.Linq;
import MiniJSON;

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

private var currentRiver : River;
private var rivers : List.<River>;
private var renderers : List.<GameObject>;

private var flyRiver : River = null;
private var flyLastIdx : int = 0;
private var flyTimer : float = 0f;
private var cameraOriginPosition : Vector3;
private var cameraOriginRotation : Quaternion;

private var riverTerrain : Terrain;

function Start () {
	rivers = new List.<River>();
	renderers = new List.<GameObject>();
	cameraOriginPosition = Camera.main.transform.position;
	cameraOriginRotation = Camera.main.transform.rotation;
	
	riverTerrain = Terrain.activeTerrain; //GameObject.Find("RiverTerrain").GetComponent.<Terrain>();
	
	Debug.Log("N - New River");
	Debug.Log("R - Regenerate current river");
	Debug.Log("F - Flyover current river");
	Debug.Log("E - Export (CURRENTLY BROKEN)");
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
	
//	Debug.DrawRay(Terrain.activeTerrain.transform.position + Terrain.activeTerrain.terrainData.size / 2, Vector3.up * 100, Color.yellow);
//	
//	var riverBoundingBox = new BoundingBox(currentRiver.points);
//	Debug.DrawRay(riverBoundingBox.center, Vector3.up * 100, Color.red);
////Debug.Log("x,y,z: " + riverBoundingBox.size.x + "," + riverBoundingBox.size.y + "," + riverBoundingBox.size.z);
//	Debug.DrawRay(riverBoundingBox.min, riverBoundingBox.max - riverBoundingBox.min, Color.blue);
//	for (var i = 0; i < currentRiver.points.Count; i++) {
//		Debug.DrawRay(currentRiver.points[i], Vector3.up * 100, Color.magenta);
//	}

	if (flyRiver != null) {
		flyTimer += Time.deltaTime;
		if (flyTimer > 0.02) {
			flyLastIdx = flyLastIdx + 1;
			flyTimer = 0f;
			if (flyLastIdx >= flyRiver.points.Count) {
				Camera.main.transform.position = cameraOriginPosition;
				Camera.main.transform.rotation = cameraOriginRotation;
				flyRiver = null;
				flyLastIdx = 0;
				flyTimer = 0;
			} else {
				var camIdx = Mathf.Max(flyLastIdx - 20, 0);
				Camera.main.transform.position = flyRiver.points[camIdx];
				Camera.main.transform.position.y = 200;
				Camera.main.transform.LookAt(flyRiver.points[flyLastIdx] + Vector3(0,160,0));
			}
		}
	}
}

function SwitchRiver(incr : int) {
	var oldIdx = rivers.IndexOf(currentRiver);
	var newIdx = oldIdx + incr;
	if (newIdx < 0) newIdx = rivers.Count - 1;
	if (newIdx >= rivers.Count) newIdx = 0;
	Blur(renderers[oldIdx]);
	Focus(renderers[newIdx]);
	currentRiver = rivers[newIdx];
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
	var r : River = ScriptableObject.CreateInstance.<River>();
	r.SetParams(StepMin, StepMax, Stickiness, RiverLength);
	r.Generate();
	rivers.Add(r);
	
	var riverBounds = new BoundingBox(r.points);
//	var lineView = Instantiate(LinePrefab, Vector3.zero, Quaternion.identity);
	var lineView = r.InstantiateRenderer(LinePrefab);
	renderers.Add(lineView);

	if (currentRiver != null) {
		Blur(renderers[rivers.IndexOf(currentRiver)]);
	}
	Focus(renderers[renderers.Count - 1]);

	currentRiver = r;
	
	SinkTerrain();
}

function DeleteRiver(river : River) {
	for (var i = 0; i < rivers.Count; i++) {
		if (rivers[i] == river) {
			rivers.RemoveAt(i);
			Destroy(renderers[i]);
			renderers.RemoveAt(i);
			break;
		}
	}
//  Could not figure out how to make this work.
//	rivers = Enumerable.Except(rivers, [river]) as List.<River>;
	if (river == currentRiver) {
		if (rivers.Count > 0) {
			currentRiver = rivers[rivers.Count - 1];
		} else {
			currentRiver = null;
		}
	}
}

function ExportRiver(river : River) {
	 var riverJSON = river.ToJSON();
	 var timestamp = new Date().ToString("s");
	 var riverPath = "Assets/Resources/river-" + timestamp + ".json";
	 System.IO.File.WriteAllText(riverPath, riverJSON);
	 Debug.Log("River saved to: " + riverPath);
}

function SinkTerrain() {
	var riverBoundingBox = new BoundingBox(currentRiver.points);
	var tData = riverTerrain.terrainData;
	var tPos = riverTerrain.transform.position;
	var tSize = tData.size;
	var tCenter = tPos + tSize / 2;
	var i : int;
	var valX : int;
	var valY : int;

	// Center the mass of river points over the terrain patch.
	for (i = 0; i < currentRiver.points.Count; i++) {
		currentRiver.points[i] += tCenter - riverBoundingBox.center;
	}
	
	// Move the line preview to match.
	var renderIdx = rivers.IndexOf(currentRiver);
	var oldView = renderers[renderIdx];
	renderers[renderIdx] = currentRiver.InstantiateRenderer(LinePrefab);
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

class River extends ScriptableObject {
	var stepMin : float;
	var stepMax : float;
	var stickiness : float;
	var length : int;
	
	var seed : float;
	var points : List.<Vector3>;
	
	public function SetParams(stepmin : float, stepmax : float, sticky: float, rlen: int) {
		stepMin = stepmin;
		stepMax = stepmax;
		stickiness = sticky;
		length = rlen;
	}
	
	function Regenerate() {
		Generate(seed);
	}
	
	function Generate() {
		Generate(Random.Range(0, 256000));
	}
	
	function Generate(newSeed : float) {
		// Randomize!
		seed = newSeed;
		Random.seed = seed;
		
		// Start at origin.
		points = new List.<Vector3>();
		points.Add(Vector3.zero);
		
		// Create increment vector and use it to calculate the first point from origin.
		var lastAngle = 0;
		var lastVector = Vector3(0,0,1);
		var lastPoint = lastVector;
		points.Add(lastVector);

		for (var i = 0; i < length - 1; i++) {
			var angle : float;
			if (Random.value > stickiness) {
				angle = Random.Range(stepMin, stepMax);
				angle = Random.value > 0.5 ? -angle : angle;
			} else {
				angle = lastAngle;
			}
			
			var newVector = Quaternion.AngleAxis(angle, Vector3.up) * lastVector;
			var newPoint = lastPoint + newVector;
			
			// If path crosses itself, back up and try this section again.
			if (points.Any(function(pt) { return (pt - newPoint).sqrMagnitude < newVector.sqrMagnitude * 0.9; })) {
				var retryLength = Mathf.Min(points.Count, 35);

				i -= retryLength;
				points.RemoveRange(points.Count - retryLength, retryLength);
				
				lastVector = points[points.Count - 1] - points[points.Count - 2];
				lastPoint = points[points.Count - 1];
				
				newVector = Quaternion.AngleAxis(angle, Vector3.up) * lastVector;
				newPoint = lastPoint + newVector;
			}
			
			points.Add(newPoint);

			lastVector = newVector;
			lastPoint = newPoint;
			lastAngle = angle;
		}
	}
	
	function InstantiateRenderer(linePrefab : GameObject) {
		var lineView = Instantiate(linePrefab, Vector3.zero, Quaternion.identity);	
		var renderer : LineRenderer = lineView.GetComponent.<LineRenderer>();
		renderer.SetVertexCount(points.Count);
		
		for (var i = 0; i < points.Count; i++) {
			renderer.SetPosition(i, Vector3(points[i].x, 100, points[i].z));
		}
		
		return lineView;
	}
	
	function ToJSON() {
		var attrs = {
			stepMin: stepMin,
			stepMax: stepMax,
			stickiness: stickiness,
			length: length,
			seed: seed
		};
		
		return Json.Serialize(attrs);	
	}
}

class BoundingBox {
	var min : Vector3;
	var max : Vector3;
	var center : Vector3;
	var size: Vector3;
	
	function BoundingBox(points : List.<Vector3>) {
		min = points[0];
		max = points[0];
		
		for (var pt : Vector3 in points) {
			min.x = Mathf.Min(min.x, pt.x);
			min.y = Mathf.Min(min.y, pt.y);
			min.z = Mathf.Min(min.z, pt.z);
			
			max.x = Mathf.Max(max.x, pt.x);
			max.y = Mathf.Max(max.y, pt.y);
			max.z = Mathf.Max(max.z, pt.z);
		}
		
		size = max - min;
		center = min + (max - min) / 2; //Vector3((max.x - min.x) / 2, (max.y - min.y) / 2, (max.z - min.z) / 2);
	}
}