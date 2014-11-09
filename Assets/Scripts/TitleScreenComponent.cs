using UnityEngine;
using System.Collections;

public class TitleScreenComponent : MonoBehaviour {

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update ()
	{
		if (Input.GetKeyDown(KeyCode.Alpha1))
		{
			GameManager.P1 = !GameManager.P1;
		}
		if (Input.GetKeyDown(KeyCode.Alpha2))
		{
			GameManager.P2 = !GameManager.P2;
		}
		if (Input.GetKeyDown(KeyCode.LeftBracket))
		{
			Application.LoadLevel("BoatTest");
		}
	}
}
