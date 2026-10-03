//! Loaf core: all business logic, persistence and event routing (ADR-002).
//!
//! This crate deliberately has no `tauri` dependency, so it builds and its tests
//! run on any machine. `scripts/check-core-no-tauri.mjs` enforces that in CI.

pub mod error;
pub mod logging;

/// The version of the core, taken from the workspace package version.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_is_semver_shaped() {
        let parts: Vec<&str> = VERSION.split('.').collect();
        assert_eq!(parts.len(), 3, "expected MAJOR.MINOR.PATCH, got {VERSION}");
        assert!(parts.iter().all(|p| p.parse::<u32>().is_ok()));
    }
}
