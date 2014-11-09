using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class CameraController : MonoBehaviour {
	public Vector3 CameraOffset;

	//[HideInInspector] [System.NonSerialized]
	//public List<GameObject> Players = new List<GameObject>();
	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		GameObject frontPlayer = getFrontPlayer();
		Camera.main.transform.LookAt(frontPlayer.transform);

		Vector3 offset = frontPlayer.transform.position + CameraOffset;
		float dist = (Camera.main.transform.position - offset).magnitude;
		//Debug.Log(dist.ToString() + " " + CameraOffset.magnitude.ToString());
		if (CameraOffset.magnitude < dist)
		{
			//Debug.Log("slerping");
			Camera.main.transform.position = Vector3.Lerp(Camera.main.transform.position, offset, Time.deltaTime / 0.5f);
			//Debug.Break();
		}
	}

	GameObject getFrontPlayer() {
		return GameManager.Players[0];
		//return Players.OrderByDescending(player => player.GetComponent<PlayerManager>().distanceTraveled).FirstOrDefault();
	}
}
