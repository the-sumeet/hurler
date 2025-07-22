# Change Log

All notable changes to the "hurler" extension will be documented in this file.

## [0.0.1] - 2025-01-22

### Added
- Initial release of Hurler extension
- **One-click execution**: Run Hurl files directly from VS Code with CodeLens buttons
- **Environment variable support**: 
  - Configure external environment files via `hurler.environmentFile` setting
  - Support for key=value format environment files
  - Automatic path resolution (relative and absolute paths)
- **Hover tooltips**: Show actual environment variable values when hovering over `{{variable}}` syntax
- **Auto output handling**:
  - Automatically create and open `.hurl.out` files
  - Results displayed in split view alongside original request
  - Capture both stdout and stderr
- **Language support**:
  - Register .hurl file extension
  - Language configuration for bracket matching and auto-closing pairs
  - Comment support with # syntax
- **Configuration options**:
  - `hurler.environmentFile`: Path to environment variables file
  - `hurler.additionalArgs`: Extra arguments to pass to hurl command

### Features
- CodeLens provider adds "Run Request" buttons above HTTP method lines
- Terminal integration for command execution
- Automatic file saving before execution
- Error handling for missing files and configuration issues
- Support for workspace and user-level settings

### Requirements
- Hurl must be installed and accessible from terminal