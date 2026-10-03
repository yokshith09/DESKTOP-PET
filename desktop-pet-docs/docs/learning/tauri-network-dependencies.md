# Tauri and network crates

**What it is.** `tauri` 2.12.1 declares `reqwest` as a normal dependency, which pulls in `hyper`, `hyper-util` and `tower`. [Certain] — `cargo tree -p loaf -i reqwest` shows `reqwest → tauri → loaf`, and we cannot remove it without dropping Tauri. 390 crates in the shell's tree; none of the HTTP ones are ours.

**Why Loaf cares.** TRD §7 promised "no HTTP client crate in the dependency tree". That promise cannot hold with Tauri. What the product actually promises is PRD NFR Privacy: zero outbound requests in Phase 0–1.

**The gotcha.** A dependency-tree check proves nothing about runtime behaviour; a crate being linked is not a crate being used. Only a runtime observation answers it.

**Measured (F0-01, Linux / WebKitGTK, debug build with embedded frontend).** The hello-world window opened and rendered, and ran 25 s under `strace -f -e trace=connect` with **0** `AF_INET`/`AF_INET6` connections. Its only `connect()` calls were 3 to the X server and 3 to the system D-Bus, all local Unix sockets. Not yet measured: Windows (WebView2) and macOS (WKWebView), which are different webview stacks.

**Open risk.** [Guessing] The WebView2 runtime is a Microsoft component and may make its own requests (updates, reputation checks) that are not Loaf's. The firewall test has to attribute traffic per process and separate Loaf's code from the runtime's.

**Source.** Tauri v2 `Cargo.toml`; `cargo tree -i`; `strace(1)`.
