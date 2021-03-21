// Movable View v1.2 EXPERIMENTAL JS PORT 01
// https://github.com/MustafaHi/Sciter-MovableView

// Call movableView('selector' [, screenBound:bool(false)]);
export function moveableView(s, screenBound = false) {
  var xoff, yoff, minXY, maxX, maxY;
  var dragging = false;

  function onMouseDown(e) {
    xoff = e.clientX; yoff = e.clientY;
    dragging = true;

    document.on("mouseup", onMouseUp);
    document.on("mouseleave", onMouseUp);
    document.on("mousemove", onMouseMove);
    e.preventDefault();
    e.stopPropagation();
  }

  function onMouseMove(e) {
    if (dragging) {
      e.preventDefault();
      Window.this.move(e.screenX - xoff, e.screenY - yoff);
    }
  }

  function onMouseUp(e) {
    if (dragging) { dragging = false; }
    document.off("mouseup");
    document.off("mouseleave");
    document.off("mousemove");
    e.preventDefault();
  }

  const elements = document.querySelectorAll(s);
  for (var i = 0; i < elements.length; ++i) {
    elements[i].on("mousedown", onMouseDown);
  }
  return true;
}