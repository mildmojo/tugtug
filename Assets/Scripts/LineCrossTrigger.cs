using UnityEngine;
using System.Collections;

public class LineCrossTrigger : MonoBehaviour {

  public RaceManager.LineKinds LineKind;

  private RaceManager raceManager;

  // Use this for initialization
  void Start () {
    raceManager = RaceManager.Instance;
  }

  // Update is called once per frame
  void Update () {

  }

  void OnTriggerEnter(Collider c) {
    raceManager.LineCrossed(LineKind, c.gameObject);
  }
}
