using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
	public static bool P1 = false;
	public static bool P2 = false;

	public GameObject P1Prefab;
	public GameObject P2Prefab;

	public static List<GameObject> Players = new List<GameObject>();

	public void Start()
	{
#if UNITY_EDITOR
		P1 = true;
#endif
		GameObject obj;

		if ((P1Prefab != null) && (GameManager.P1))
		{
			obj = GameObject.Instantiate(P1Prefab) as GameObject;
			Players.Add(obj);
		}
		if ((P2Prefab != null) && (GameManager.P2))
		{
			obj = GameObject.Instantiate(P2Prefab) as GameObject;
			Players.Add(obj);
		}
	}
}
