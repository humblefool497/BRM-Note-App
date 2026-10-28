import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Download,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
  FileCode,
  Terminal
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { usePWAInstall } from '../utils/usePWAInstall';

interface InstallAndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
  userEmail?: string;
}

export const InstallAndroidModal: React.FC<InstallAndroidModalProps> = ({
  isOpen,
  onClose,
  appUrl,
  userEmail = 'linux.debasish@gmail.com',
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'apk' | 'troubleshoot'>('scan');

  const targetUrl =
    appUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-lzl3ue7oenpiqfbeto6uow-526561661959.us-west1.run.app');

  useEffect(() => {
    if (isOpen && targetUrl) {
      QRCode.toDataURL(
        targetUrl,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0369a1',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeDataUrl(url);
          }
        }
      );
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Install BRM Intelligence on your Android Phone');
    const body = encodeURIComponent(
      `Hi,\n\nHere is your link to install BRM Intelligence on your Android phone:\n\n${targetUrl}\n\nImportant Note: Please open this link in Google Chrome (tap the 3 dots and choose 'Open in Chrome' if opened inside an in-app viewer). Then tap 'Install app' or 'Add to Home screen'!\n\nEnjoy your new CRM assistant!`
    );
    window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppSend = () => {
    const text = encodeURIComponent(
      `🚀 Install BRM Intelligence on your Android Phone:\n${targetUrl}\n\n(Tip: In WhatsApp, tap the link, then tap the three dots (⋮) in top right and choose 'Open in Chrome', then tap 'Install app')`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleNativeInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setActiveTab('troubleshoot');
    }
  };

  // Generate full Android Studio project ZIP with APK builder script
  const handleDownloadAndroidZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Root files
      zip.file(
        'settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "BRMAssistant"
include(":app")
`
      );

      zip.file(
        'build.gradle.kts',
        `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
      );

      zip.file(
        'gradle.properties',
        `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
      );

      zip.file(
        'build-apk.sh',
        `#!/bin/bash
echo "Building BRM Intelligence Android APK..."
chmod +x gradlew
./gradlew assembleDebug
echo "--------------------------------------------------------"
echo "APK successfully built at:"
echo "app/build/outputs/apk/debug/app-debug.apk"
echo "--------------------------------------------------------"
echo "Transfer app-debug.apk to your Android phone to install!"
`
      );

      zip.file(
        'build-apk.bat',
        `@echo off
echo Building BRM Intelligence Android APK...
call gradlew.bat assembleDebug
echo --------------------------------------------------------
echo APK successfully built at:
echo app\\build\\outputs\\apk\\debug\\app-debug.apk
echo --------------------------------------------------------
echo Transfer app-debug.apk to your Android phone to install!
pause
`
      );

      zip.file(
        'INSTALLATION_GUIDE.md',
        `# BRM Intelligence - APK Installation Guide

## Option A: Direct Home Screen App (No Android Studio Needed!)
1. Open Chrome on your Android phone.
2. Go to: ${targetUrl}
3. Tap the three dots (⋮) in the top right corner.
4. Tap "Install app" or "Add to Home screen".
5. The BRM icon appears on your home screen and runs like a native APK with zero address bar!

## Option B: Build & Install Native APK (.apk)
1. Open this unzipped folder in Android Studio.
2. Connect your Android phone to your PC via USB cable (enable USB Debugging in Developer Options).
3. Click "Run" (Shift + F10) or in terminal run:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
4. The generated APK file is at:
   \`app/build/outputs/apk/debug/app-debug.apk\`
5. Copy \`app-debug.apk\` to your Android phone and tap it in your Files app to install!
`
      );

      // App folder
      const app = zip.folder('app');
      app?.file(
        'build.gradle.kts',
        `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.brm.assistant"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.brm.assistant"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
`
      );

      // Manifest
      const main = app?.folder('src')?.folder('main');
      main?.file(
        'AndroidManifest.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="BRM Intelligence"
        android:theme="@android:style/Theme.Material.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
      );

      // Kotlin source files
      const pkg = main?.folder('java')?.folder('com')?.folder('brm')?.folder('assistant');

      pkg?.file(
        'CrmModels.kt',
        `package com.brm.assistant

data class ActionItem(
    val id: String = java.util.UUID.randomUUID().toString(),
    val tag: String,
    val task: String,
    var isDone: Boolean = false
)

enum class TagType {
    CRITICAL, REQ, GOV, FOLLOW_UP, OTHER
}

fun parseTagType(tag: String): TagType {
    return when {
        tag.contains("CRITICAL", ignoreCase = true) -> TagType.CRITICAL
        tag.contains("REQ", ignoreCase = true) -> TagType.REQ
        tag.contains("GOV", ignoreCase = true) -> TagType.GOV
        tag.contains("Follow-Up", ignoreCase = true) -> TagType.FOLLOW_UP
        else -> TagType.OTHER
    }
}

data class ParsedCrmData(
    val clientOrganization: String = "",
    val customerName: String = "",
    val meetingDate: String = "",
    val meetingContext: String = "",
    val clientManagers: List<String> = emptyList(),
    val internalTeams: List<String> = emptyList(),
    val clientFeedback: List<String> = emptyList(),
    val newRequirements: List<String> = emptyList(),
    val actionItems: List<ActionItem> = emptyList(),
    val rawMarkdown: String = ""
)
`
      );

      pkg?.file(
        'MainActivity.kt',
        `package com.brm.assistant

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF38BDF8),
                    surface = Color(0xFF1E293B),
                    background = Color(0xFF0F172A)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BrmDashboardScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BrmDashboardScreen(viewModel: BrmViewModel = viewModel()) {
    val input by viewModel.rawInput.collectAsState()
    val apiKey by viewModel.apiKey.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("BRM Intelligence", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                OutlinedTextField(
                    value = apiKey,
                    onValueChange = viewModel::onApiKeyChanged,
                    label = { Text("Gemini API Key") },
                    placeholder = { Text("Paste your API key...") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }

            item {
                OutlinedTextField(
                    value = input,
                    onValueChange = viewModel::onInputChanged,
                    label = { Text("Raw Meeting Notes / Transcript") },
                    placeholder = { Text("e.g. Met with Sarah today, requested analytics dash...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = viewModel::loadSampleNote,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Fill Sample")
                    }

                    Button(
                        onClick = viewModel::processMeetingNotes,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Structure")
                    }
                }
            }

            when (val state = uiState) {
                is UiState.Loading -> {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }
                is UiState.Error -> {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = state.message,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }
                is UiState.Success -> {
                    val data = state.data

                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilledTonalButton(onClick = {
                                clipboard.setText(AnnotatedString(data.rawMarkdown))
                            }) {
                                Text("Copy Markdown")
                            }

                            FilledTonalButton(onClick = {
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_TEXT, data.rawMarkdown)
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Share CRM Data"))
                            }) {
                                Icon(Icons.Default.Share, contentDescription = null)
                                Spacer(Modifier.width(4.dp))
                                Text("Share")
                            }
                        }
                    }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("🏢 Organization: \${data.clientOrganization}", fontWeight = FontWeight.Bold)
                                Text("👤 Customer: \${data.customerName}")
                                Text("📅 Date: \${data.meetingDate}")
                                Text("🎯 Context: \${data.meetingContext}")
                            }
                        }
                    }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Client Managers: \${data.clientManagers.joinToString(\", \")}")
                                Text("Internal Teams: \${data.internalTeams.joinToString(\", \")}")
                            }
                        }
                    }

                    item {
                        Text(
                            text = "📋 Action Items & To-Do List",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    items(data.actionItems) { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp).fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = item.isDone,
                                    onCheckedChange = { viewModel.toggleActionItem(item.id) }
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "[\${item.tag}]",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = Color(0xFF38BDF8)
                                    )
                                    Text(
                                        text = item.task,
                                        textDecoration = if (item.isDone) TextDecoration.LineThrough else TextDecoration.None
                                    )
                                }
                            }
                        }
                    }
                }
                UiState.Idle -> {
                    item {
                        Text("Ready to structure notes. Tap Fill Sample or paste text.", color = Color.Gray)
                    }
                }
            }
        }
    }
}
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'BRM_Intelligence_Android_APK_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create Android ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Install on Android Phone</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fix installation or download APK project package
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'scan'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Install via Chrome</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'apk'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download APK Package</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'troubleshoot'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Fix "Not Installing"</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white rounded-2xl shadow-xl ring-4 ring-cyan-500/20 inline-block">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to install on Android phone"
                    className="w-56 h-56 rounded-lg block"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating install QR code...
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Step 1: Scan with Android Camera & Open in Chrome
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Point your phone's camera at this code. <strong className="text-emerald-400">Important:</strong> Make sure the link opens in <strong className="text-white">Google Chrome</strong> (not an in-app viewer).
                </p>
              </div>

              {/* Direct share / send to phone options */}
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <button
                  onClick={handleSendEmail}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Email to My Phone</span>
                </button>

                <button
                  onClick={handleWhatsAppSend}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

              {/* Copy URL bar */}
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-300 truncate text-[11px] text-left">
                  {targetUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Standalone Android APK Package (.zip)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Includes pre-configured Android Gradle project, Kotlin sources, Manifest, and 1-click build scripts (`build-apk.sh` and `build-apk.bat`) that immediately compile into a signed `app-debug.apk`.
                </p>

                <button
                  onClick={handleDownloadAndroidZip}
                  disabled={isZipping}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isZipping ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Packaging APK Project...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Downloaded APK Package ZIP!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Android APK Package (.zip)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  1-Click Build Command:
                </span>
                <p className="text-[11px] text-slate-400">
                  Unzip the downloaded folder and run:
                </p>
                <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-cyan-300 font-mono text-[11px]">
                  ./gradlew assembleDebug
                </pre>
                <p className="text-[11px] text-slate-400">
                  Outputs <span className="text-emerald-400 font-mono">app/build/outputs/apk/debug/app-debug.apk</span>. Copy it to your phone and tap to install!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'troubleshoot' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Why didn't the installation trigger?</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  When you open links from <strong>WhatsApp</strong>, <strong>Gmail</strong>, or <strong>Telegram</strong>, Android opens them inside a restricted <em>In-App Browser</em> where installation is blocked by default.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Tap the 3 dots (⋮) inside the in-app browser</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Look at the top-right corner of your screen when opening the link.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Select "Open in Chrome"</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This transfers the session to real Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Tap "Install app" in Chrome's menu</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      In Chrome, tap the 3 dots (⋮) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Ready for all Android devices</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
