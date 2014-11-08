using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class CameraController : MonoBehaviour {
	[HideInInspector] [System.NonSerialized]
	public List<GameObject> Players = new List<GameObject>();
	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
		GameObject frontPlayer = getFrontPlayer();
		Camera.main.transform.LookAt(frontPlayer.transform);
	}

	GameObject getFrontPlayer() {
		return Players.OrderByDescending(player => player.GetComponent<PlayerManager>().distanceTraveled).FirstOrDefault();
	}
}
