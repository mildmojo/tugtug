using UnityEngine;
using System.Collections;

public class RaceManager : MonoBehaviour {

	public GUIStyle style;
	private static float time;
	public static float RaceTime
	{
		get { return time; }
	}

	// Use this for initialization
	void Start () {
		RaceManager.time = 0f;
	}
	
	// Update is called once per frame
	void Update () {
		RaceManager.time += Time.deltaTime;
	}

	private void OnGUI()
	{
		GUI.Label(new Rect((Screen.width - 200) / 2, 10, 200, 50), string.Format("{0:00}:{1:00}", RaceManager.time / 60, RaceManager.time % 60), style);
	}

}
