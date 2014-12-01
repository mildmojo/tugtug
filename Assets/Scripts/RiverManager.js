#pragma strict

import System.Collections.Generic;
import System.Linq;

// Access this property from other scripts to read the current river object.
@HideInInspector @System.NonSerialized
public var CurrentRiver : River;

// Center point for starting pool.
@HideInInspector @System.NonSerialized
public var StartPoolCenter : Vector3;

// Center point for finish pool.
@HideInInspector @System.NonSerialized
public var FinishPoolCenter : Vector3;

public var JetstreamPrefab : GameObject;
public var JetstreamFrequency : int;
public var JetstreamStrength : float;
public var JetstreamMaxSpeed : float = 3f;

public var Water : GameObject;

public var RiverFiles : List.<TextAsset>;


private var rivers : List.<River>;
private var jetstreams : List.<GameObject>;

private var riverTerrain : Terrain;
private var originalHeightMap : float[,];

private var waterElevation : float;

// Add a button to the editor to sort the river file list by name.
@CustomEditor (RiverManager)
class RiverManagerFileSorter extends Editor {
	function OnInspectorGUI () {
		DrawDefaultInspector();
		if (GUILayout.Button("Sort by name")) {
			var currentTarget = target as RiverManager;
			currentTarget.RiverFiles = currentTarget.RiverFiles.OrderBy(function(x) { return x.name; }).ToList();
		}
	}

	function compareNames(a : TextAsset, b : TextAsset) : int {
		return a.name.CompareTo(b.name);
	}
}

function Start () {
	waterElevation = Water.transform.position.y;
	riverTerrain = Terrain.activeTerrain;
	SaveTerrain();
	LoadRivers();
	
	Debug.Log("N - Next river");
	Debug.Log("P - Previous river");
}

function Update () {
	// For testing only. Remove this code when actual level selection is in place.
	if (Input.GetKeyDown(KeyCode.N)) {
		NextRiver();
	} else if (Input.GetKeyDown(KeyCode.P)) {
		PrevRiver();
	}
	
	if (CurrentRiver) {
		Debug.DrawRay(CurrentRiver.points.First(), Vector3.up * 30, Color.magenta);
		Debug.DrawRay(CurrentRiver.points.Last(), Vector3.up * 30, Color.magenta);
		Debug.DrawRay(CurrentRiver.points.First() + Vector3.up * 30, GetMeanVector(CurrentRiver.points.Take(60).ToList()).normalized * -30, Color.green);
		Debug.DrawRay(CurrentRiver.points.Last() + Vector3.up * 30, GetMeanVector(CurrentRiver.points.AsEnumerable().Reverse().Take(60).ToList()).normalized * -30, Color.green);
	}
}

// Don't persist game-time terrain modifications to edit mode.
function OnApplicationQuit() {
	RestoreTerrain();
}

// Selects the next river and repaints the terrain.
public function NextRiver() {
	IncrRiver(1);
	Redraw();
	SendMessage("SetRiverPoints", CurrentRiver.points);
	SendMessage("SetSpawnPoint", StartPoolCenter);
}

// Selects the previous river and repaints the terrain.
public function PrevRiver() {
	IncrRiver(-1);
	Redraw();
	SendMessage("SetRiverPoints", CurrentRiver.points);
	SendMessage("SetSpawnPoint", StartPoolCenter);
}

// Repaints the terrain.
public function Redraw() {
	RestoreTerrain();
	SinkTerrain();
	WipeJetstreams();
	CreateJetstreams();
}

function IncrRiver(incr : int) {
	var newIdx : int;
	if (CurrentRiver) {
		var oldIdx = rivers.IndexOf(CurrentRiver);
		newIdx = oldIdx + incr;
	} else {
		newIdx = 0;
	}
	if (newIdx < 0) newIdx = rivers.Count - 1;
	if (newIdx >= rivers.Count) newIdx = 0;
	CurrentRiver = rivers[newIdx];
}

function SaveTerrain() {
	var tData = riverTerrain.terrainData;
	originalHeightMap = tData.GetHeights(0, 0, tData.heightmapWidth, tData.heightmapHeight);
}

function RestoreTerrain() {
	if (originalHeightMap != null) {
		riverTerrain.terrainData.SetHeights(0, 0, originalHeightMap);
	}
}

function LoadRivers() {
	rivers = new List.<River>();
	
	for (var file in RiverFiles) {
		var river = new River(file.text);
		river.Regenerate();
		rivers.Add(river);
	}
	
	if (rivers.Count > 0) {
		CurrentRiver = rivers[0];
	}
}

function SinkTerrain() {
	var riverBoundingBox = CurrentRiver.ToBoundingBox();
	var points : List.<Vector3> = CurrentRiver.points;
	var tData = riverTerrain.terrainData;
	var tPos = riverTerrain.transform.position;
	var tSize = tData.size;
	var tCenter = tPos + tSize / 2;
	var worldUnitsPerMapPoint = Vector3(tData.size.x / tData.heightmapWidth, 0, tData.size.z / tData.heightmapHeight);
	var i : int;
	var valX : int;
	var valY : int;
	
	tCenter.y = 0;
	riverBoundingBox.center.y = 0;

	// Center the mass of river points over the terrain patch.
	for (i = 0; i < points.Count; i++) {
		points[i] += tCenter - riverBoundingBox.center;
	}
	
	var startPoolSize = 40;
	var finishPoolSize = 40;
	
	StartPoolCenter = GetStartCentroid(startPoolSize);
	FinishPoolCenter = GetFinishCentroid(finishPoolSize);

	var startBrush = MakeCircleBrush(startPoolSize, 0.9, 1.0); // matrix size, inner val, outer val
	var finishBrush = MakeCircleBrush(finishPoolSize, 0.9, 1.0);
	var startPoints = CircleAround(StartPoolCenter, startPoolSize * 0.66, 24); // center, radius, point count
	var finishPoints = CircleAround(FinishPoolCenter, finishPoolSize * 0.66, 24);
		
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
	
	ApplyBrush(valleyBrush, riverTerrain, points);
	ApplyBrush(riverBrush, riverTerrain, points);
	ApplyBrush(startBrush, riverTerrain, startPoints);
	ApplyBrush(finishBrush, riverTerrain, finishPoints);
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
				heights[terZ + z, terX + x] *= brush[x,z];
			}
		}
	}
	
	tData.SetHeights(0,0, heights);
}

// Create a 2D array of floats to represent a bowl-shaped heightmap.
function MakeCircleBrush(brushSize : int, innerVal : float, outerVal : float) : float[,] {
	var brush : float[,] = new float[brushSize, brushSize];
	var range = outerVal - innerVal;
	
	for (var valY = 0; valY < brushSize; valY++) {
		var rowVal = 1 - Mathf.Sin(Mathf.PI * valY / parseFloat(brushSize));
		for (var valX = 0; valX < brushSize; valX++) {
			var colVal = 1 - Mathf.Sin(Mathf.PI * valX / parseFloat(brushSize));
			brush[valY, valX] = rowVal * colVal * range * 2 + innerVal;
			brush[valY, valX] = Mathf.Min(1.0, brush[valY, valX]);
		}
	}

	return brush;
}

// Returns a list of `count` points `radius` away from `point` in a circle.
function CircleAround(point : Vector3, radius : float, count : int) : List.<Vector3> {
	var points = new List.<Vector3>();
	var offset = Vector3.one * radius;
	
	for (var i = 0; i < count; i++) {
		offset = Quaternion.AngleAxis(i / parseFloat(count) * 360, Vector3.up) * offset;
		points.Add(point + offset);	
	}
	
	return points;
}

// Get average of vectors from first N points to first point (pointing toward start)
// Normalize to unit vector
// Multiply by percentage of start pool size in world coords
// Add to first point to get center for startBrush circle
function GetStartCentroid(startPoolSize : int) : Vector3 {
	var tData = riverTerrain.terrainData;
	var worldUnitsPerMapPoint = Vector3(tData.size.x / tData.heightmapWidth, 0, tData.size.z / tData.heightmapHeight);
	var points = CurrentRiver.points;
	
	var pointFirst = points.First();
	var startOffsetDir = GetMeanVector(points.Take(60).Select(function(pt, idx) { 
		return pointFirst - pt;
	}).ToList()).normalized;
	var startOffsetMgn = startPoolSize * worldUnitsPerMapPoint.x * 0.45;
	var startOffset = startOffsetDir * startOffsetMgn;
	var startPoint = points.First() + startOffset;

	return startPoint;
}

function GetFinishCentroid(finishPoolSize : int) : Vector3 {
	var tData = riverTerrain.terrainData;
	var worldUnitsPerMapPoint = Vector3(tData.size.x / tData.heightmapWidth, 0, tData.size.z / tData.heightmapHeight);
	var points = CurrentRiver.points;

	var pointLast = points.Last();
	var finishOffsetDir = GetMeanVector(points.AsEnumerable().Reverse().Take(60).Select(function(pt, idx) { 
		return pointLast - pt;
	}).ToList()).normalized;
	var finishOffsetMgn = finishPoolSize * worldUnitsPerMapPoint.x * 0.45;
	var finishOffset = finishOffsetDir * finishOffsetMgn;
	var finishPoint = points.Last() + finishOffset;

	return finishPoint;
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

function WipeJetstreams() {
	for (var j in jetstreams) {
		Destroy(j);
	}
	
	jetstreams = new List.<GameObject>();
}

function CreateJetstreams() {
	jetstreams = CreateAlong(CurrentRiver.points, JetstreamPrefab, JetstreamFrequency, waterElevation);
	
	for (var i = 0; i < jetstreams.Count; i++) {
		jetstreams[i].transform.localScale.x = 100;
		jetstreams[i].transform.localScale.y = 1;
		var settings = jetstreams[i].GetComponent.<JetStreamComponent>();
		settings.Force.z = JetstreamStrength;
		settings.MaxStreamSpeed = JetstreamMaxSpeed;
//		settings.forward = i == 0 ? 
	}
}

function CreateAlong(points : List.<Vector3>, prefab : GameObject, frequency : int, atElevation : float) : List.<GameObject> {
	var collection = new List.<GameObject>();
	
	for (var i = 0; i < points.Count - frequency; i++) {
		if (i % frequency == 0) {
			var point = points[i];
			var lookAtIdx = i + frequency;
			var direction = lookAtIdx > points.Count ? point - points[i-1] : points[lookAtIdx] - point;
			var gameObj = Instantiate(prefab, point + Vector3.up * atElevation, Quaternion.LookRotation(direction)) as GameObject;
			collection.Add(gameObj);
		}
	}
	
	return collection;
}
