using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class RaceManager : MonoBehaviour {

	public static RaceManager Instance;
	public static float RaceTime {
		get { return time; }
	}
	private static float time;

	public GUIStyle style;
	public enum LineKinds {
		START,
		FINISH
	};

	private GameManager gameManager;
	private Dictionary<GameObject, float> finishes;
	private bool isActive;

	void Awake() {
		Instance = this;
	}

	void Start () {
		gameManager = GameManager.Instance;
		Reset();
	}

	// Update is called once per frame
	void Update () {
		if (isActive) {
			RaceManager.time += Time.deltaTime;
		}
	}

	public void Reset() {
		RaceManager.time = 0f;
		finishes = new Dictionary<GameObject, float>();
	}

	public void LineCrossed(LineKinds lineKind, GameObject player) {
		if (lineKind == LineKinds.START) {
			isActive = true;
		} else if (lineKind == LineKinds.FINISH) {
			try {
				finishes.Add(player, RaceManager.time);
			} catch (System.ArgumentException) {
				// Player already crossed the finish line
			}

			if (finishes.Count() == GameManager.Players.Count()) {
				gameManager.OnRaceFinish(finishes);
				isActive = false;
			}
		}
	}

	private void OnGUI()
	{
		var rect = new Rect((Screen.width - 200) / 2, 10, 200, 50);
		var timeStr = string.Format("{0:00}:{1:00}", RaceManager.time / 60, RaceManager.time % 60);
		GUI.Label(rect, timeStr, style);
	}

}
