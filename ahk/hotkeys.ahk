#NoTrayIcon

locked := false

;SetTimer, SendCursorCoords, 50

;SendCursorCoords:
    ;CoordMode, Mouse, Screen
    ;MouseGetPos, x, y
    ;FileAppend,[CURSOR] %x% %y%`r`n,* ; stdout << "[CURSOR] 123, 654" 
    ;return

;r:: 
    ;STDIN := FileOpen("*", "r")
    ;line := RTrim(STDIN.ReadLine(), "`n")
    ;MouseGetPos, xpos, ypos
    ;MsgBox, %line% The cursor is at X%xpos% Y%ypos%.
    ;return

^!+x:: ; CTRL SHIFT ALT X
    SetTitleMatchMode 2 ; find window title starting with
    WinSet, ExStyle, ^0x20, Crossover Lite ; make window click-through
    locked := !locked
    FileAppend,[LOCK] %locked%`r`n,* ; stdout << "[LOCK] 1" 
    return

^!+a::
    FileAppend,[ABOUT]`r`n,* ; stdout << "[ABOUT]"
    return

^!+c:: 
    FileAppend,[CENTER]`r`n,* ; stdout << "[CENTER]" 
    return

^!+Up::
    FileAppend,[MOVE] Up`r`n,* ; stdout << "[MOVE] Up" 
    return

^!+Down::
    FileAppend,[MOVE] Down`r`n,* ; stdout << "[MOVE] Down" 
    return

^!+Left::
    FileAppend,[MOVE] Left`r`n,* ; stdout << "[MOVE] Left" 
    return

^!+Right::
    FileAppend,[MOVE] Right`r`n,* ; stdout << "[MOVE] Right" 
    return