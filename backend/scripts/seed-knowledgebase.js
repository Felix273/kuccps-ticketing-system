const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const STARTER_ARTICLES = [
  // ── 1. PRINTERS: DRIVER SETUP ──────────────────────────────
  {
    title: 'Kyocera TASKalfa & ECOSYS: KX Driver Installation & Standard TCP/IP Port Setup',
    category: 'Printers & Scanners',
    affectedDevices: 'Kyocera TASKalfa 4054ci, 5054ci, 3554ci, ECOSYS M3645idn, P3155dn',
    symptoms: 'Windows prints unreadable raw characters, default double-sided duplexing is missing, or printer status randomly goes to "Offline" over WSD.',
    cause: 'Windows 10/11 auto-installed a generic Microsoft IPP/WSD Class Driver instead of the manufacturer-certified Kyocera KX V4 Driver, or WSD port dropped the IP handshake.',
    resolution: `1. Download and extract the official **Kyocera KX V4 Driver Package** from the local ICT driver repository (\`\\\\fileserver\\ICT-Drivers\\Kyocera\`).
2. Open **Windows Run** (\`Win + R\`), type \`control printers\`, and press Enter.
3. Click **Add a printer** -> Select **The printer that I want isn't listed**.
4. Choose **Add a printer using an IP address or hostname** -> Device Type: **TCP/IP Device**.
5. Enter the printer static IP address (e.g., \`10.10.20.45\`). Uncheck *"Query the printer and automatically select driver"*.
6. In Additional Port Information, select **Custom** -> Settings -> Ensure Protocol is **Raw**, Port Number is **9100**, and **SNMP Status Enabled** is **UNCHECKED** (prevents false offline states across VLANs).
7. Click **Have Disk...**, browse to \`Kx84_UPD_...\\en\\64bit\\OEMSETUP.INF\`, and select **Kyocera TASKalfa 4054ci KX**.
8. Right-click the newly installed printer -> **Printer Properties** -> **Device Settings** tab:
   - Click **PDL Settings** -> Set to **KPDL (PostScript)** or **PCL XL**.
   - Under **Option**, ensure Cassettes 3 & 4 and the Duplex Unit are marked as **Installed**.
9. Print a Windows Test Page to verify duplexing and page rendering.`,
    escalation: 'Escalate to Tier 3 Network Administrator if pinging the printer static IP fails, or if port 9100 is blocked across inter-VLAN access control lists (ACLs).',
    tags: 'kyocera, printer, driver, kx-driver, taskalfa, ecosys, port-9100, tcp-ip',
    excerpt: 'Step-by-step setup for Kyocera TASKalfa and ECOSYS multi-function printers using the certified KX Driver and Raw 9100 port.'
  },

  // ── 2. PRINTERS: PAPER JAMS ────────────────────────────────
  {
    title: 'Kyocera Printers: Clearing Paper Jams & Cleaning Cassette Feed Rollers (Jam Codes J-0511, J-4201)',
    category: 'Printers & Scanners',
    affectedDevices: 'Kyocera TASKalfa 4054ci / 5054ci, ECOSYS M3645idn',
    symptoms: 'Printer stops mid-cycle displaying error "Paper Jam in Cassette 1", jam code J-0511 (Paper feed jam), or J-4201 (Paper path exit jam). Multiple sheets feed simultaneously or slip with squeaking sound.',
    cause: 'Glazed or paper-dust coated pick-up, feed, and retard rollers in Cassette 1; or incorrect paper weight/media type selected in paper tray settings (e.g. 80 GSM loaded but tray configured for Heavy/Cardstock).',
    resolution: `1. **Clear Paper Path**:
   - Open Right Cover 1 and Right Cover 2 by squeezing the release handles.
   - Gently pull stuck paper in the direction of the paper transport path (never pull backward against fuser roller teeth).
   - Inspect the fuser entrance area for tiny torn paper scraps.
2. **Inspect and Clean Feed Rollers**:
   - Pull Cassette 1 completely out of the printer chassis.
   - Look inside the upper feed opening to locate the 3 rubber rollers: **Pick-up Roller**, **Feed Roller**, and **Separation/Retard Roller**.
   - Moisten a clean, lint-free microfiber cloth with 70% isopropyl alcohol or roller-restorer fluid.
   - Rotate each roller by hand, wiping away gray paper dust and toner glaze until the gray rubber texture is restored.
3. **Verify Paper Size & Weight Alignment**:
   - Ensure the green cassette guide tabs are snugly touching the edge of the A4 paper stack (avoid overfilling past the MAX arrow).
   - On the printer touch screen: Press **System Menu / Counter** -> **Common Settings** -> **Cassette Settings** -> **Cassette 1**.
   - Verify Paper Size is set to **A4** and Media Type is set to **Plain (60 to 90 g/m²)**.`,
    escalation: 'If jam code J-0511 repeats immediately after roller cleaning, the rubber tire treads are worn flat. Escalate to the contracted Kyocera Hardware Leasing Vendor for cassette feed roller replacement.',
    tags: 'kyocera, paper-jam, j-0511, j-4201, rollers, cassette, maintenance',
    excerpt: 'Resolution guide for clearing recurring paper jams and cleaning feed and retard rollers on Kyocera multi-function printers.'
  },

  // ── 3. PRINTERS: SCAN-TO-EMAIL & SCAN-TO-SMB ───────────────
  {
    title: 'Kyocera Printers: Scan-to-Email & Scan-to-SMB Folder Setup via Command Center RX',
    category: 'Printers & Scanners',
    affectedDevices: 'Kyocera TASKalfa 3554ci / 4054ci / 5054ci, ECOSYS M3645idn',
    symptoms: 'Scan fails with "Error 0x1102" (Network connection timeout on SMTP) or "Error 0x2101" (SMB authentication failure or folder path not found).',
    cause: 'SMBv1 disabled on Windows 11 client, port 445 blocked by local Windows Defender Firewall, or Microsoft 365 SMTP client submission requires modern authentication / app password.',
    resolution: `1. **Access Command Center RX**:
   - Open a browser on an ICT workstation and navigate to \`https://<printer-ip>\`.
   - Log in using Administrator credentials (Default Username: \`Admin\`, Password: \`Admin\` or device serial number).
2. **Configure Scan-to-SMB (Direct Folder Scan)**:
   - On the target user workstation, create folder \`C:\\Scans\`. Right-click -> **Properties** -> **Sharing** -> **Advanced Sharing** -> Share this folder as \`Scans\`.
   - Set Permissions: Grant target user **Read/Write**.
   - In Command Center RX: Navigate to **Function Settings** -> **Address Book** -> Click **Add Contact**.
   - Name: User's Name.
   - SMB Settings: Host Name: \`\\\\<User-PC-IP>\` or \`\\\\<ComputerName>\`. Path: \`Scans\`. Port: **445**.
   - Login Username: \`KUCCPS\\username\`, Password: user's domain password.
   - Navigate to **Security** -> **Network Security** -> Verify **SMBv2/v3** is enabled.
3. **Configure Scan-to-Email (M365 SMTP)**:
   - Navigate to **Function Settings** -> **E-mail**.
   - SMTP Server Name: \`smtp.office365.com\`. SMTP Port Number: **587**.
   - Authentication Protocol: **ON** (SMTP AUTH).
   - Authenticate As: Other -> Enter dedicated scanner account: \`scanner@kuccps.ac.ke\` and M365 App Password.
   - SSL/TLS: **STARTTLS**. Sender Address: \`scanner@kuccps.ac.ke\`.
4. Run a test scan from the document feeder to verify delivery.`,
    escalation: 'Escalate to Senior Systems Admin if M365 Conditional Access blocks SMTP AUTH or if network firewall drops outbound port 587 traffic.',
    tags: 'kyocera, scan-to-email, scan-to-smb, 0x1102, 0x2101, command-center-rx, smtp',
    excerpt: 'Configuring Scan-to-SMB folders and Scan-to-Email on Kyocera multi-function printers through Command Center RX.'
  },

  // ── 4. PRINTERS: TONER & WASTE TONER BOX ───────────────────
  {
    title: 'Kyocera Printers: Toner Replacement & Waste Toner Box Error (C-7990 / C-7901)',
    category: 'Printers & Scanners',
    affectedDevices: 'Kyocera TASKalfa 4054ci / 5054ci, ECOSYS M3645idn',
    symptoms: 'Touch screen displays "Waste Toner Box is full. Replace with a new box", or error code C-7990 (Waste toner reservoir full) or C-7901 (Waste toner motor lock). Printer refuses all print jobs.',
    cause: 'The waste toner reservoir optical sensor is covered in toner dust, or the physical waste container is at 100% capacity.',
    resolution: `1. Open the lower front cover of the Kyocera TASKalfa unit.
2. Locate the dark gray waste toner container.
3. Squeeze the two blue release locking levers inward and gently pull the waste toner container straight out horizontally.
   - *Caution:* Keep the container completely level to avoid fine toner powder spillage.
4. If installing a **New Waste Toner Box** (supplied inside fresh genuine Kyocera toner box kits):
   - Place the protective transport cap over the full box port for safe disposal.
   - Unpack the new waste container and inspect the transparent optical sensor prism windows on the back sides.
   - Ensure the optical prism windows are completely clear of dust.
5. If emergency temporary cleaning is required:
   - Wipe the clear optical sensor eyes located inside the printer cavity with a dry cotton swab.
6. Slide the waste container firmly into the slot until both blue levers click into the locked position.
7. Close the front cover. The LCD will perform a 30-second toner motor calibration cycle.`,
    escalation: 'If code C-7990 returns immediately with a brand new waste box, the internal optical sensor board is defective. Contact the authorized hardware service partner.',
    tags: 'kyocera, toner, waste-box, c-7990, c-7901, maintenance, taskalfa',
    excerpt: 'Handling toner container replacement and resolving error codes C-7990 / C-7901 on Kyocera TASKalfa systems.'
  },

  // ── 5. PRINTERS: JOB ACCOUNTING CODES ──────────────────────
  {
    title: 'Kyocera Printers: Job Accounting Codes & Directorate PIN Setup',
    category: 'Printers & Scanners',
    affectedDevices: 'Kyocera TASKalfa & ECOSYS Institutional Fleet',
    symptoms: 'Print jobs send successfully from Windows but disappear without printing; printer display shows "Restricted: Job Accounting Error".',
    cause: 'Directorate printing quota policy is enforced; the Kyocera KX driver on the client computer has no Account ID configured.',
    resolution: `1. On the user's computer, press \`Win + R\`, type \`control printers\`, and press Enter.
2. Right-click the Kyocera printer -> Select **Printing Preferences** (not Printer Properties).
3. In the Kyocera KX preferences window, click the **Device Settings** tab.
4. Click the **Administrator** button in the lower-right area.
5. In the Administrator settings window:
   - Check **Job Accounting**.
   - In the **Account ID** field, type the 4-digit code assigned to the user's Directorate (e.g., \`4201\` for Placement, \`1001\` for ICT).
   - If this is a shared workstation (multiple staff on one PC), check *"Prompt for Account ID"* so each user inputs their code upon printing.
6. Click **OK**, then click **Apply** on Printing Preferences.
7. Send a 1-page test document to verify accounting code acceptance.`,
    escalation: 'Consult the ICT Director if a new Directorate requires an Account ID code provisioned in Command Center RX.',
    tags: 'kyocera, job-accounting, pin, billing, user-codes, quotas',
    excerpt: 'Configuring Kyocera Job Accounting and 4-digit departmental PIN codes in the Windows KX driver.'
  },

  // ── 6. NETWORK: EDUROAM & STAFF WI-FI ──────────────────────
  {
    title: 'Network: Staff Wi-Fi & eduroam 802.1X WPA2-Enterprise Configuration',
    category: 'Network & Connectivity',
    affectedDevices: 'Windows 10/11, macOS, Android 11-14, iOS/iPadOS',
    symptoms: 'Connecting to "eduroam" or "KUCCPS-Staff" results in "Can\'t connect to this network", constant password prompts, or IP address stuck on 169.254.x.x (APIPA).',
    cause: 'Stale 802.1X PEAP-MSCHAPv2 certificate cache on device, randomized MAC address enabled (bypassing DHCP reservation), or incorrect domain username syntax.',
    resolution: `1. **Windows 10/11**:
   - Open Settings -> Network & internet -> Wi-Fi -> **Manage known networks**.
   - Select **eduroam** / **KUCCPS-Staff** -> Click **Forget**.
   - Click the Wi-Fi icon on the taskbar, select **eduroam** -> Check *"Connect automatically"*.
   - Username format: **username@kuccps.ac.ke** (must include the institutional realm).
   - Password: User's Active Directory domain password.
   - When prompted with *"Continue connecting? The server presented a certificate..."*, click **Connect**.
2. **Android 11 - 14**:
   - EAP Method: **PEAP**.
   - Phase 2 Authentication: **MSCHAPv2**.
   - CA Certificate: **Use system certificates** (or "Don't validate" for legacy APs).
   - Online Certificate Status: **Do not verify**.
   - Domain: **kuccps.ac.ke**.
   - Identity: **username@kuccps.ac.ke**.
   - Anonymous Identity: Leave blank.
   - Privacy: Change from "Use randomized MAC" to **Use device MAC** (crucial for 802.1X DHCP assignment).
3. **Flush Client Network Stack**:
   - Open Command Prompt as Administrator:
     \`\`\`cmd
     netsh winsock reset
     ipconfig /flushdns
     ipconfig /renew
     \`\`\``,
    escalation: 'Escalate to Network Admin if RADIUS Network Policy Server (NPS) logs show Event ID 6273 (Audit Failure: Reason Code 16 - Bad Credentials or Expired User Cert).',
    tags: 'wifi, eduroam, 802.1x, peap, mschapv2, wireless, android, radius',
    excerpt: 'Resolving authentication failures and configuring 802.1X WPA2-Enterprise for eduroam and KUCCPS Staff Wi-Fi.'
  },

  // ── 7. NETWORK: FORTICLIENT SSL-VPN ────────────────────────
  {
    title: 'VPN: KUCCPS Staff FortiClient Remote Access Gateway Troubleshooting',
    category: 'Network & Connectivity',
    affectedDevices: 'Staff Laptops, Windows 10/11, macOS',
    symptoms: 'FortiClient VPN connection gets stuck at 40%, 48%, or 98% and disconnects with error: "Unable to establish the VPN connection (-8)" or "VPN server may be unreachable".',
    cause: 'Port 10443 blocked on user remote ISP (common on some mobile hotspots), virtual Fortinet network adapter binding corrupted, or MFA token expiration.',
    resolution: `1. **Verify VPN Connection Profile Settings**:
   - VPN Type: **SSL-VPN**.
   - Connection Name: \`KUCCPS Remote Gateway\`.
   - Remote Gateway: \`vpn.kuccps.ac.ke\`.
   - Customize Port: **Checked**, Port: \`10443\`.
   - Single Sign-On (SSO): Enabled (if configured) or Prompt on connect.
2. **Resolve Stuck at 40% (Network / Handshake Failure)**:
   - Check user home internet connection: Verify DNS resolves:
     \`\`\`cmd
     nslookup vpn.kuccps.ac.ke
     \`\`\`
   - If user is on a mobile hotspot, have them switch APN settings or temporarily test alternate connection.
3. **Resolve Stuck at 98% (Virtual Adapter Driver Binding)**:
   - Press \`Win + X\` -> Select **Device Manager**.
   - Expand **Network adapters**.
   - Right-click **Fortinet Virtual Ethernet Adapter** -> Select **Uninstall device** (do NOT check delete driver software).
   - In the top menu, click **Action** -> **Scan for hardware changes**.
   - Windows will cleanly rebind the virtual adapter.
4. **Flush DNS & Reset Winsock**:
   \`\`\`cmd
   ipconfig /flushdns
   netsh int ip reset
   \`\`\`
5. Relaunch FortiClient and authenticate.`,
    escalation: 'Escalate to Network Security Officer if user Active Directory account is missing from the `SG_VPN_Authorized_Users` security group on the firewall.',
    tags: 'vpn, forticlient, ssl-vpn, 10443, remote-access, work-from-home',
    excerpt: 'Troubleshooting FortiClient SSL-VPN connection errors (-8), 40% and 98% stalls, and virtual adapter driver bindings.'
  },

  // ── 8. ACTIVE DIRECTORY: PASSWORD RESETS & LOCKOUTS ────────
  {
    title: 'Active Directory: Password Reset & Account Lockout Clearance SOP',
    category: 'Active Directory & Access',
    affectedDevices: 'Windows Workstations, Active Directory Domain Controllers',
    symptoms: 'User receives Windows prompt: "The referenced account is currently locked out and may not be logged on to." User is unable to sign in to workstation, email, or ticketing portal.',
    cause: 'User exceeded the 5-attempt invalid password threshold. Often caused by stale credentials cached on mobile Outlook, mapped network drives, or auto-sync background apps.',
    resolution: `1. **Identify and Clear Lockout in ADUC**:
   - Log into Domain Controller or launch **Remote Server Administration Tools (RSAT)**: \`dsa.msc\`.
   - Locate user under target Directorate OU (e.g. \`OU=Placement,OU=Staff,DC=kuccps,DC=ac,DC=ke\`).
   - Right-click user -> **Properties** -> Click **Account** tab.
   - Check the box: **Unlock account. The account is currently locked out on this Active Directory Domain Controller**.
   - Click **Apply**.
2. **Execute Password Reset**:
   - Right-click user -> Select **Reset Password...**
   - Enter temporary compliant password (Must meet complexity: minimum 12 characters, uppercase, lowercase, number, symbol: e.g., \`Kuccps#2026!Oct\`).
   - Check **"User must change password at next logon"**.
   - Uncheck "Account is locked out" if prompted.
3. **Prevent Immediate Re-Lockout**:
   - Instruct user to immediately turn off Wi-Fi on their personal mobile devices (phones/tablets).
   - Stale Wi-Fi/email passwords on phones will flood the DC and re-lock the account within 60 seconds.
   - Have user sign in on their physical workstation and set their new permanent password.
   - Update password on secondary devices.`,
    escalation: 'If account locks out continuously every 5 minutes while user is idle, run `LockoutStatus.exe` to identify the originating workstation/device IP generating bad Kerberos requests.',
    tags: 'active-directory, password-reset, lockout, aduc, security, credentials',
    excerpt: 'Standard operating procedure for clearing account lockouts and securely resetting passwords in Active Directory.'
  },

  // ── 9. EMAIL & COLLABORATION: OUTLOOK / M365 ───────────────
  {
    title: 'Email: Microsoft 365 Outlook Profile Corruption & Modern Auth Token Reset',
    category: 'Email & Collaboration',
    affectedDevices: 'Microsoft 365 Apps for Enterprise, Outlook 2019 / 2021',
    symptoms: 'Outlook repeatedly prompts for password with blank modern auth dialog, hangs indefinitely on "Loading Profile...", or displays "Cannot start Microsoft Outlook. Cannot open the Outlook window".',
    cause: 'Corrupted Identity Token in Windows Web Account Manager (WAM) or corrupted local Exchange cache (.ost file).',
    resolution: `1. **End Stuck Outlook Processes**:
   - Press \`Ctrl + Shift + Esc\` to open Task Manager.
   - Kill any lingering **Microsoft Outlook** and **OfficeClickToRun** background tasks.
2. **Clear Corrupted Identity Tokens in Credential Manager**:
   - Open **Windows Credential Manager** (\`control /name Microsoft.CredentialManager\`).
   - Click **Windows Credentials**.
   - Under Generic Credentials, locate and click **Remove** on all entries starting with:
     - \`MicrosoftOffice16_Data:ADAL:...\`
     - \`MS.Outlook:...\`
     - \`ADAL:...\`
3. **Test Outlook Safe Mode**:
   - Press \`Win + R\`, type \`outlook.exe /safe\`, and press Enter.
   - If Outlook opens normally in Safe Mode, a third-party add-in is crashing startup. Go to File -> Options -> Add-ins -> Disable COM Add-ins.
4. **Rebuild Local .OST Cache**:
   - Navigate to \`%localappdata%\\Microsoft\\Outlook\`.
   - Rename \`<user@kuccps.ac.ke>.ost\` to \`<user@kuccps.ac.ke>.ost.old\`.
   - Start Outlook. Exchange Online will rebuild a fresh, indexed cache copy automatically.`,
    escalation: 'Escalate to Tier 3 Mail Administrator if Microsoft 365 Admin Center reports mailbox license unassigned or mailbox quarantine status.',
    tags: 'email, outlook, m365, ost, modern-auth, credentials, exchange',
    excerpt: 'Resolving Outlook credential loops, profile loading hangs, and rebuilding local OST data files.'
  },

  // ── 10. HARDWARE: DOCKING STATIONS & DUAL MONITORS ──────────
  {
    title: 'Hardware: USB-C Docking Stations (Dell WD19 / HP G5) Dual Monitor & LAN Disconnects',
    category: 'Hardware & Workstations',
    affectedDevices: 'Dell WD19 / WD19S, HP USB-C Dock G5, Dual DisplayPort/HDMI setups',
    symptoms: 'External monitors remain black or say "No Signal" when laptop is connected to dock; Gigabit Ethernet drops intermittently; laptop displays "Slow charger" warning.',
    cause: 'Thunderbolt/DisplayPort MST hub in dock entered power lock state, or dock is connected with standard 65W laptop charger instead of dedicated 130W/180W dock AC power adapter.',
    resolution: `1. **Power Discharge the Docking Station (Hard Reset)**:
   - Unplug the USB-C cable from the laptop.
   - Unplug the power supply brick from the back of the docking station.
   - Disconnect all external monitors (HDMI / DisplayPort) from the dock.
   - **Press and hold the dock power button for 20 seconds** to drain residual capacitive charge.
   - Plug the power cable back into the dock (verify LED indicator illuminates).
2. **Verify Correct Power Brick Rating**:
   - Dell WD19 and HP G5 docks require **130W or 180W power supplies**.
   - Verify user did not accidentally plug a small 45W/65W laptop charger into the dock.
3. **Connect Laptop & Reset Display Driver**:
   - Plug the dock USB-C cable firmly into the laptop's dedicated Thunderbolt/DisplayPort-enabled USB-C port (marked with lightning or 'D' icon).
   - In Windows, press **\`Win + Ctrl + Shift + B\`** (the screen will blink and beep, resetting the GPU driver).
4. **Reconnect Monitors**:
   - Connect Monitor 1 via DisplayPort. Wait for detection.
   - Connect Monitor 2 via HDMI.
   - Press \`Win + P\` -> select **Extend**.`,
    escalation: 'If USB-C cable or connector pins on the laptop motherboard are physically loose or bent, log a hardware repair ticket with the internal Hardware Workshop.',
    tags: 'hardware, dock, usb-c, dell-wd19, hp-g5, monitors, displayport, hdmi',
    excerpt: 'Fixing dual display detection failures, power delivery warnings, and performing hard discharge resets on USB-C docks.'
  },

  // ── 11. SOFTWARE: PLACEMENT ERP & ORACLE CLIENT ────────────
  {
    title: 'Software: KUCCPS Placement Application Client Installation & Oracle ORA-12154 Setup',
    category: 'Software & Applications',
    affectedDevices: 'Placement Officer Workstations, Windows 10/11 64-bit',
    symptoms: 'Placement processing application fails on launch with: "ORA-12154: TNS:could not resolve the connect identifier specified" or "Initialization error: Could not load dynamic library oci.dll".',
    cause: 'Oracle Instant Client 32-bit/64-bit architecture mismatch, missing TNS_ADMIN environment variable, or missing Visual C++ Redistributable 2015-2022.',
    resolution: `1. **Install Prerequisites**:
   - Install **Visual C++ Redistributable 2015-2022** (Install BOTH \`vc_redist.x86.exe\` and \`vc_redist.x64.exe\`).
2. **Deploy Oracle Instant Client**:
   - Ensure Oracle Instant Client 19c is located in \`C:\\oracle\\instantclient_19_8\`.
3. **Configure Environment Variables**:
   - Open Windows Run (\`Win + R\`), type \`sysdm.cpl\`, and press Enter.
   - Go to **Advanced** tab -> Click **Environment Variables**.
   - Under **System variables**:
     - Edit \`Path\` -> Add \`C:\\oracle\\instantclient_19_8\` at the top of the list.
     - Click **New** -> Variable name: \`TNS_ADMIN\`, Variable value: \`C:\\oracle\\network\\admin\`.
4. **Deploy tnsnames.ora**:
   - Copy validated \`tnsnames.ora\` from \`\\\\fileserver\\ICT-Software\\Oracle\\tnsnames.ora\` into \`C:\\oracle\\network\\admin\\\`.
   - Open Command Prompt:
     \`\`\`cmd
     tnsping PLACEMENT_PROD
     \`\`\`
   - Verify reply returns: \`OK (10 msec)\`.
5. Launch the KUCCPS Central Placement Application as Administrator.`,
    escalation: 'Escalate to Database Administrator (DBA) if tnsping returns "TNS-12541: TNS:no listener" (indicating the database listener service is stopped).',
    tags: 'software, erp, placement, oracle, ora-12154, tnsnames, instant-client',
    excerpt: 'Configuring Oracle Instant Client, TNS_ADMIN variables, and resolving ORA-12154 errors for the KUCCPS Placement application.'
  },

  // ── 12. SECURITY: PHISHING & COMPROMISED CREDENTIALS ────────
  {
    title: 'Security: Phishing Incident Containment & Compromised Mailbox SOP',
    category: 'Security & Access',
    affectedDevices: 'All Staff Accounts, Microsoft 365, Active Directory',
    symptoms: 'User clicked a suspicious link in an email, entered password on a spoofed portal, or the account is actively sending out mass unauthorized spam to external addresses.',
    cause: 'Credential theft via adversary-in-the-middle (AiTM) phishing, session cookie hijacking, or malicious OAuth enterprise app consent grant.',
    resolution: `1. **Immediate Account Isolation**:
   - Immediately change the user's Active Directory and Microsoft 365 password.
   - In M365 Admin Center -> Active Users -> Select User -> Click **Sign out of all sessions** (terminates all active browser session cookies across all devices).
2. **Inspect and Remove Malicious Inbox Forwarding Rules**:
   - Attackers frequently hide auto-forwarding or auto-delete rules.
   - Connect to Exchange Online PowerShell:
     \`\`\`powershell
     Get-InboxRule -Mailbox user@kuccps.ac.ke | Select-Object Name, Description, ForwardTo, RedirectTo
     \`\`\`
   - Remove any suspicious forwarding rules:
     \`\`\`powershell
     Remove-InboxRule -Mailbox user@kuccps.ac.ke -Identity "RuleName"
     \`\`\`
3. **Revoke Malicious OAuth App Consents**:
   - Go to **Microsoft Entra Admin Center** -> **Enterprise Applications**.
   - Review permissions consented by user; remove any unauthorized third-party applications with \`Mail.ReadWrite\` or \`User.Read\`.
4. **Physical Host Inspection**:
   - Disconnect user computer from LAN/Wi-Fi.
   - Run **Windows Defender Offline Scan** (\`Start-MpWDOScan\`).`,
    escalation: 'Immediately notify the Head of ICT and Cybersecurity Lead. If financial or placement data was accessed, log an emergency Data Protection Incident report.',
    tags: 'security, phishing, compromised, m365, powershell, containment, malware',
    excerpt: 'Emergency containment steps for handling phishing incidents, revoking active session cookies, and purging malicious inbox rules.'
  },

  // ── 13. MEETING ROOMS & VIDEO CONFERENCING ─────────────────
  {
    title: 'Meeting Rooms: Boardroom Projector "No Signal" & Logitech MeetUp Video Conferencing',
    category: 'Meeting Rooms & AV',
    affectedDevices: 'Boardroom Laser Projector, Logitech MeetUp, Logitech Rally, Crestron Switcher',
    symptoms: 'Projector displays blue screen with "No Signal (HDMI 1)", or Microsoft Teams / Zoom cannot detect the room ceiling microphone / speakerphone.',
    cause: 'Crestron switcher input locked to inactive source, Windows display set to "Second screen only", or USB hub entered sleep mode.',
    resolution: `1. **Verify Video Output**:
   - Ensure the HDMI cable is plugged into the tabletop transmitter box labeled **HDMI 1**.
   - On the Crestron wall touch panel: Press **Display ON** -> Select source: **Table HDMI 1**.
   - On the presenter's laptop, press **\`Win + P\`** -> Select **Duplicate** (or Extend).
   - If screen flickers black: In Windows Display Settings, change external resolution to **1920 x 1080 @ 60Hz** (some 4K laptop displays send unsupported refresh rates to older boardroom switchers).
2. **Audio & Camera Routing (Teams / Zoom / Meet)**:
   - Plug the USB-A cable labeled **"Conference Camera"** into the presenter laptop.
   - In Microsoft Teams -> Settings -> **Devices**:
     - Audio Device: **Custom Setup**.
     - Speaker: **Echo Cancelling Speakerphone (Logitech MeetUp)**.
     - Microphone: **Echo Cancelling Speakerphone (Logitech MeetUp)**.
     - Camera: **Logitech MeetUp Camera**.
3. **Logitech MeetUp Power Cycle**:
   - If camera LED is completely dark, locate the rack in the credenza and toggle the power switch for the AV rack power distribution unit (PDU).`,
    escalation: 'Escalate to Audio-Visual Support Tech if floor box HDMI cable has broken pins or if wall Crestron panel displays "System Comm Error".',
    tags: 'meeting-room, projector, no-signal, logitech-meetup, teams, zoom, hdmi',
    excerpt: 'Resolving projector signal detection issues and configuring Logitech conference camera audio routing in meeting rooms.'
  },

  // ── 14. ONBOARDING & OFFBOARDING SOP ───────────────────────
  {
    title: 'ICT SOP: New Staff Onboarding & Employee Offboarding Technology Handover Checklist',
    category: 'Onboarding & Offboarding',
    affectedDevices: 'Staff Laptops, AD Accounts, Email, ERP, Access Control',
    symptoms: 'Standard operating checklist to ensure full compliance during employee hire and separation.',
    cause: 'Institutional security, asset governance, and service level compliance.',
    resolution: `1. **New Staff Onboarding Checklist**:
   - [ ] Verify approved HR Requisition and Directorate allocation.
   - [ ] **Active Directory**: Create account in target Directorate OU (\`OU=<Directorate>,OU=Staff,DC=kuccps,DC=ac,DC=ke\`).
   - [ ] Assign Security Groups based on Directorate role (e.g. \`SG_Placement_Staff\`).
   - [ ] **Email**: Assign Microsoft 365 Business Standard license. Verify default institutional signature template.
   - [ ] **ERP / Placement App**: Create database user schema in Placement Testing / Prod if authorized by ICT Director.
   - [ ] **Hardware**: Image standard laptop with KUCCPS Windows 11 Enterprise SOE (Standard Operating Environment).
   - [ ] Install: Sophos Endpoint, FortiClient VPN, Kyocera KX Print Drivers, MS Office 365.
   - [ ] Issue laptop, power supply, and mouse; user must sign the **ICT Asset Handover Form**.
2. **Staff Offboarding Checklist**:
   - [ ] Receive formal HR Offboarding notice with separation date.
   - [ ] **Disable Account**: In AD, right-click user -> **Disable Account** (\`userAccountControl & 2\`).
   - [ ] **Revoke Sessions**: In M365 Admin Center, click "Sign out of all sessions".
   - [ ] **Convert Mailbox**: Convert user mailbox to Shared Mailbox (retain for 90-day directorate handover); grant manager read permissions.
   - [ ] **Asset Recovery**: Inspect and collect physical laptop, AC adapter, bag, and security tokens.
   - [ ] Wipe / Re-image device into unassigned equipment inventory.`,
    escalation: 'Notify Head of ICT immediately if an offboarding employee fails to surrender institutional IT assets.',
    tags: 'onboarding, offboarding, checklist, sop, hr, active-directory, assets',
    excerpt: 'Standard operating procedure checklist for provisioning new hires and securely offboarding exiting KUCCPS staff.'
  },
  {
    title: 'KUCCPS ICT Service Level Agreement and Incident Severity Targets',
    category: 'Service Levels & Policies',
    affectedDevices: 'All ICT service requests, incidents, information inquiries, and development work',
    symptoms: 'Use this policy when setting requester expectations, assigning ticket timelines, or reviewing service-level compliance.',
    cause: 'The service charter defines maximum service timelines by category and response/resolution targets by incident severity.',
    resolution: `## Service categories
- Equipment Issuance: respond immediately; complete within 24 hours.
- Hardware Support: respond immediately; complete within 24 hours.
- Software Support: respond immediately; complete within 48 hours.
- Provision of Information: respond immediately; complete within 7 days.
- Incident/Problem Resolution: use the incident severity targets below.
- Software Development: deliver as specified in the approved development specifications; the charter defines no numeric default.
- Information Inquiry: respond immediately; complete within 3 days.

## Incident/Problem Resolution severity targets
- Very High: 90% response within 30 working minutes; 100% resolution within 1 working day.
- High: 90% response within 60 working minutes; 100% resolution within 1 working day.
- Medium: 90% response within 1 working day; 100% resolution within 5 working days.
- Low: 90% response within 2 working days; 100% resolution within 5 working days.
- Very Low: 90% response within 3 working days; 100% resolution within 7 working days.

## Time calculation
The configured working calendar is Monday-Friday, 08:00-17:00 Africa/Nairobi. Weekends and Kenya public holidays are excluded from working-time targets. All numeric durations are configured as working time; one working day is nine working hours. SLA dates are snapshotted when a ticket is created, so later settings changes do not recalculate existing ticket deadlines.

Legacy ticket priority Critical maps to Very High for severity-based SLA calculations. The existing 48-hour post-SLA escalation grace is operational policy, not an SLA target.`,
    escalation: 'For High and Very High incidents, notify the assignee and administrators after the configured post-SLA escalation grace.',
    tags: 'sla, service-level, response-time, resolution-time, incident-severity, escalation',
    excerpt: 'The KUCCPS service categories, incident response/resolution goals, severity mapping, working calendar, and escalation policy.'
  }
];

async function seed() {
  console.log('🚀 Seeding Enterprise ICT Knowledge Base...');

  const articlesToSeed = process.argv.includes('--sla-only')
    ? STARTER_ARTICLES.filter(article => article.category === 'Service Levels & Policies')
    : STARTER_ARTICLES;

  if (process.argv.includes('--sla-only') && articlesToSeed.length !== 1) {
    throw new Error(`Expected exactly one SLA article, found ${articlesToSeed.length}.`);
  }

  for (const article of articlesToSeed) {
    const slug = slugify(article.title);
    
    // Synthesize standard markdown content if not explicitly supplied
    const synthesizedContent = `
## Problem Symptoms
${article.symptoms}

## Affected Devices & Models
${article.affectedDevices}

## Root Cause
${article.cause}

## Step-by-Step Resolution
${article.resolution}

## When to Escalate (Tier 3 Path)
${article.escalation}
`.trim();

    await prisma.knowledgeArticle.upsert({
      where: { slug },
      update: {
        title: article.title,
        category: article.category,
        affectedDevices: article.affectedDevices,
        symptoms: article.symptoms,
        cause: article.cause,
        resolution: article.resolution,
        escalation: article.escalation,
        tags: article.tags,
        excerpt: article.excerpt,
        content: synthesizedContent,
        status: 'published',
        isArchived: false,
        version: 1,
        authorName: 'ICT Directorate',
        authorRole: 'admin'
      },
      create: {
        title: article.title,
        slug,
        category: article.category,
        affectedDevices: article.affectedDevices,
        symptoms: article.symptoms,
        cause: article.cause,
        resolution: article.resolution,
        escalation: article.escalation,
        tags: article.tags,
        excerpt: article.excerpt,
        content: synthesizedContent,
        status: 'published',
        isArchived: false,
        version: 1,
        authorName: 'ICT Directorate',
        authorRole: 'admin',
        revisions: {
          create: {
            version: 1,
            title: article.title,
            content: synthesizedContent,
            symptoms: article.symptoms,
            resolution: article.resolution,
            changedBy: 'ICT Directorate Seed',
            reason: 'Initial institutional enterprise baseline'
          }
        }
      }
    });

    console.log(`✓ Seeded: [${article.category}] ${article.title.slice(0, 50)}...`);
  }

  const count = await prisma.knowledgeArticle.count();
  console.log(`\n🎉 Complete! Total active Knowledge Base articles in database: ${count}`);
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
