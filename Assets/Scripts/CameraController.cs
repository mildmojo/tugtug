﻿using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class CameraController : MonoBehaviour {
	public Vector3 CameraOffset;

	[Range(0f, 1f)]
	public float FrontPlayerBias = 0.75f;
	public float Snappiness = 100f;

	//[HideInInspector] [System.NonSerialized]
	//public List<GameObject> Players = new List<GameObject>();
	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		GameObject frontPlayer = getFrontPlayer() ?? GameManager.Players[0];
		GameObject lastPlayer = getLastPlayer() ?? GameManager.Players[GameManager.Players.Count - 1];

		var lookPosition = (frontPlayer.transform.position - lastPlayer.transform.position) * FrontPlayerBias + 
			lastPlayer.transform.position;
//		var playerRotation = Quaternion.LookRotation(frontPlayer.transform.forward);
		var lookRotation = Quaternion.LookRotation(frontPlayer.transform.forward);
		var currentPosition = Camera.main.transform.position;
		var currentRotation = Camera.main.transform.rotation;

		var targetPosition = frontPlayer.transform.position + lookRotation * CameraOffset;
		var targetRotation = Quaternion.LookRotation(lookPosition - currentPosition);

		Camera.main.transform.position = Vector3.Lerp(currentPosition, targetPosition, Snappiness / 100 * Time.deltaTime);
		Camera.main.transform.rotation = Quaternion.Slerp(currentRotation, targetRotation, Snappiness / 100 * Time.deltaTime);
	}

	GameObject getFrontPlayer() {
		var standings = GameManager.GetStandings();
		if (standings != null) Debug.Log(standings.Count);
		return standings == null ? null : standings.First();
	}

	GameObject getLastPlayer() {
		var standings = GameManager.GetStandings();
		return standings == null ? null : standings.Last();
	}
}
