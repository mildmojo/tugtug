#pragma strict

import System.Collections.Generic;
import System.Linq;

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

function Start () {
	rivers = new List.<River>();
	renderers = new List.<GameObject>();
	cameraOriginPosition = Camera.main.transform.position;
	cameraOriginRotation = Camera.main.transform.rotation;
	Debug.Log("N - New River");
	Debug.Log("R - Regenerate current river");
	Debug.Log("F - Flyover current river");
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
	} else if (Input.GetKeyDown(KeyCode.Delete)) {
		DeleteRiver(currentRiver);
	} else if (Input.GetKeyDown(KeyCode.LeftBracket)) {
		SwitchRiver(-1);
	} else if (Input.GetKeyDown(KeyCode.RightBracket)) {
		SwitchRiver(1);
	}
	
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
				Camera.main.transform.position.y += 30;
				Camera.main.transform.LookAt(flyRiver.points[flyLastIdx]);
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
	var r = new River(StepMin, StepMax, Stickiness, RiverLength);
	r.Generate();
	rivers.Add(r);
	
	var lineView = Instantiate(LinePrefab, Vector3.zero, Quaternion.identity);
	r.PopulateRenderer(lineView);
	renderers.Add(lineView);

	if (currentRiver != null) {
		Blur(renderers[rivers.IndexOf(currentRiver)]);
	}
	Focus(renderers[renderers.Count - 1]);

	currentRiver = r;	
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

class River {
	var stepMin : float;
	var stepMax : float;
	var stickiness : float;
	var length : int;
	
	var seed : float;
	var points : List.<Vector3>;
	
	function River(stepmin : float, stepmax : float, sticky: float, rlen: int) {
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
		var lastVector = Vector3(0,0,2);
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
	
	function PopulateRenderer(lineView : GameObject) {
		var renderer : LineRenderer = lineView.GetComponent.<LineRenderer>();
		renderer.SetVertexCount(points.Count);
		
		for (var i = 0; i < points.Count; i++) {
			renderer.SetPosition(i, points[i]);
		}
	}
}