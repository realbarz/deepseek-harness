import sys
import io
import base64
import pyautogui
from PIL import Image
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("windows-computer-control")

# Configure PyAutoGUI safety settings
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.5

@mcp.tool()
def take_screenshot() -> str:
    """Captures the primary monitor and returns a base64 encoded PNG image."""
    screenshot = pyautogui.screenshot()
    buffer = io.BytesIO()
    screenshot.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

@mcp.tool()
def mouse_click(x: int, y: int, button: str = "left") -> str:
    """Clicks the mouse at screen coordinates (x, y)."""
    pyautogui.click(x=x, y=y, button=button)
    return f"Clicked {button} at ({x}, {y})"

@mcp.tool()
def type_text(text: str) -> str:
    """Types a string into the active window."""
    pyautogui.write(text, interval=0.05)
    return f"Typed: {text}"

@mcp.tool()
def press_key(key: str) -> str:
    """Presses a single key (e.g., 'enter', 'tab', 'esc', 'ctrl')."""
    pyautogui.press(key)
    return f"Pressed key: {key}"

@mcp.tool()
def key_combination(keys: list[str]) -> str:
    """Executes key combinations (e.g., ['alt', 'tab'] or ['ctrl', 'c'])."""
    pyautogui.hotkey(*keys)
    return f"Executed shortcut: {'+'.join(keys)}"

if __name__ == "__main__":
    mcp.run()