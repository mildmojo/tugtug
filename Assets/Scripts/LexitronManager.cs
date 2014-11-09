/* LexitronManager.cs 
 * 
 * https://gist.github.com/mildmojo/027cde9ca4663981cf67
 *
 * Lexitron arcade cabinet compatibility for your game... in a can!
 * 
 * Attach this script to any GameObject in your scene, preferably
 * wherever you're attaching the rest of your global game state
 * manager scripts. Either make sure the script is on an object in
 * every scene or make the object with this script attached survive
 * scene changes by calling DontDestroyOnLoad on it: 
 *   http://docs.unity3d.com/ScriptReference/Object.DontDestroyOnLoad.html
 * 
 * Start the game with the "-lexitron" command line argument to switch
 * on the following Lexitron-specific behaviors:
 * 
 * - 1920x1080 fullscreen
 * - Hides mouse
 * - Coin insert '=' broadcasts OnCoinInsert (calls OnCoinInsert methods in any of your scripts automatically)
 * - LEX button tap '[' broadcasts OnLexButton (calls OnLexButton methods in any of your scripts automatically)
 * - LEX button long-press ']' quits
 * - Quits after 2 minutes of inactivity (no sticks/buttons/keys triggered)
 *
 * Remember to listen for joystick movement on the D-pad (axes 6 and 7).
 * Check Edit -> Project Settings -> Input for the names of the
 * Lexitron-specific joystick axes you can use with `Input.GetAxis()`.
 *
 * See the full dev guidelines at: http://runjumpdev.org/lexitron-game-guidelines
 */

using UnityEngine;
using System;
using System.Linq;

public class LexitronManager : MonoBehaviour {
  [HideInInspector] [NonSerialized]
  public int InactivityTimeout = 120;
  
  [HideInInspector]
  public readonly string[] LEXITRON_AXES = {
    "Lexitron Stick 1 Horizontal", 
    "Lexitron Stick 1 Vertical", 
    "Lexitron Stick 2 Horizontal",
    "Lexitron Stick 2 Vertical"
  };
  
  private float timerInactivity;
  
  public void ResetInactivityTimer() {
    timerInactivity = 0f;
  }
  
  void Awake () {
    // Enable this component if the "-lexitron" command line argument was given.
    this.enabled = Environment.GetCommandLineArgs().Any(arg => arg.Equals("-lexitron"));
    
    // If this isn't the Lexitron, give up.
    if (!this.enabled) return;
    
    // Start the inactivity timer.
    timerInactivity = 0f;
    // Hide the mouse cursor.
    Screen.showCursor = false;
    // Switch to full screen 1080p if not already there.
    if (Screen.width != 1920 || Screen.height != 1080) {
      Debug.Log("Going fullscreen at 1080p...");
      Screen.SetResolution(1920, 1080, true);
    }
  }
  
  void Update () {
    // Update the timer and quit if it's expired.
    timerInactivity += Time.deltaTime;
    if (isAnyInputDown()) ResetInactivityTimer ();
    if (timerInactivity > InactivityTimeout) Application.Quit();

    // Coin insert: '='
    if (Input.GetKeyDown(KeyCode.Equals)) {
      BroadcastMessage("OnCoinInsert");
    }
    
    // LEX button tap: '['
    if (Input.GetKeyDown(KeyCode.LeftBracket)) {
      BroadcastMessage("OnLexButton");
    }
    
    // LEX button held down: ']'
    if (Input.GetKeyDown(KeyCode.RightBracket)) {
      Application.Quit();
    }
  }

  bool isAnyInputDown() {
    return Input.anyKey || isAnyAxisHeld();
  }

  bool isAnyAxisHeld() {
    return LEXITRON_AXES.Any(axis => roundAbs(Input.GetAxis(axis)) == 1);
  }
  
  // Take the absolute value of `num` and round to an integer.
  int roundAbs(float num) {
    return (int) Math.Round(Math.Abs(num), 0, MidpointRounding.AwayFromZero);
  }
  
}
