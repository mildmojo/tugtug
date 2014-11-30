using UnityEngine;
using System.Collections;

public class CheckpointComponent : MonoBehaviour {

	[HideInInspector] [System.NonSerialized]
	public GameManager gameManager;

	[System.NonSerialized]
	// Numeric ID representing distance from start.
	public int id;

	void Start () {
	
	}
	
	void Update () {
	
	}
}
