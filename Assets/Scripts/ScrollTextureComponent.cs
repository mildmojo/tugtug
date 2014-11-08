using UnityEngine;
using System.Collections;

public class ScrollTextureComponent : MonoBehaviour {

	public Vector2 Movement;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void FixedUpdate () {
		this.renderer.material.mainTextureOffset += Movement * Time.deltaTime;
	}
}
