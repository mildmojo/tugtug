using UnityEngine;
using UnityEngine.UI;

public class TextController : MonoBehaviour {

  [System.NonSerialized]
  public int index;

  private Text textComponent;
  public GameObject panel;
  private Color textColor = Color.white;

  void Awake () {
    textComponent = GetComponentInChildren<Text>();
    textColor = textComponent.color;
  }

  void Update () {

  }

  public void SetIndex(int idx) {
    index = idx;
  }

  public void SetText(string text) {
    textComponent.text = text;
  }

  public void SetColor(Color newColor) {
    textColor = newColor;
  }

  public void SetColor(string hexColor) {
    textColor = HexToColor(hexColor);
  }

  public void SetPosition(Vector3 newPos) {
    panel.transform.position = newPos;
  }

  public void TweenIn(float time = 2.0f) {
    LeanTween.cancel(panel);
    SetPosition(new Vector3(Screen.width * 1.5f, Screen.height / 2f, 0f));
    LeanTween.moveX(panel, Screen.width / 2f, time)
             .setEase(LeanTweenType.easeOutQuad);
  }

  public void TweenOut(float time = 2.0f) {
    LeanTween.cancel(panel);
    LeanTween.moveX(panel, -Screen.width * 1.5f, time)
             .setEase(LeanTweenType.easeInQuad);
  }

  Color HexToColor(string hex) {
    byte r = byte.Parse(hex.Substring(0,2), System.Globalization.NumberStyles.HexNumber);
    byte g = byte.Parse(hex.Substring(2,2), System.Globalization.NumberStyles.HexNumber);
    byte b = byte.Parse(hex.Substring(4,2), System.Globalization.NumberStyles.HexNumber);
    return new Color32(r,g,b, 255);
  }
}
