Output demo/run-proxy-server.gif

Require run-proxy-server

Set Shell "bash"
Set Framerate 60
Set FontSize 12
Set Width 800
Set Height 400
Set Padding 20
Set Margin 5
Set MarginFill "#212830"
Set BorderRadius 10

Hide
Type 'cd /tmp/run-proxy-server-demo && clear' Enter
Show

Type "run-proxy-server" Sleep 200ms Enter
Wait Sleep 1800ms

Enter Enter Type "# start a caching HTTP proxy in front of a target URL" Sleep 200ms Enter Enter
Wait Sleep 800ms

Type "run-proxy-server http://example.com --port 8000" Sleep 500ms Enter
Sleep 2500ms
Ctrl+C
Sleep 1500ms

Sleep 2s
