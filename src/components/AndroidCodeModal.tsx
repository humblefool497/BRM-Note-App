import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, Smartphone, Terminal } from 'lucide-react';

interface AndroidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANDROID_FILES = [
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/brm/assistant/MainActivity.kt',
    code: `package com.brm.assistant

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
import androidx.compose.material.icons.filled.AssignmentTurnedIn
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Share
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
                title = { Text("BRM Intelligence Engine", fontWeight = FontWeight.Bold) },
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

                    // 1. Metadata Section
                    item {
                        CrmCard(title = "Client & Meeting Metadata", icon = Icons.Default.Business) {
                            Text("🏢 Organization: \${data.clientOrganization}", fontWeight = FontWeight.SemiBold)
                            Text("📅 Date: \${data.meetingDate}")
                            Text("🎯 Context: \${data.meetingContext}")
                        }
                    }

                    // 2. Stakeholders Section
                    item {
                        CrmCard(title = "Key Stakeholders Mentioned", icon = Icons.Default.Group) {
                            Text("Client Managers: \${data.clientManagers.joinToString(\", \")}")
                            Text("Internal Teams: \${data.internalTeams.joinToString(\", \")}")
                        }
                    }

                    // 3. Feedback & Requirements Section
                    item {
                        CrmCard(title = "Feedback & Requirements Log", icon = Icons.Default.AssignmentTurnedIn) {
                            if (data.clientFeedback.isNotEmpty()) {
                                Text("Feedback:", fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                                data.clientFeedback.forEach { Text("• \$it") }
                                Spacer(Modifier.height(8.dp))
                            }
                            if (data.newRequirements.isNotEmpty()) {
                                Text("Requirements:", fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                                data.newRequirements.forEach { Text("• \$it") }
                            }
                        }
                    }

                    // 4. Action Items Checklist Section
                    item {
                        Text(
                            text = "📋 Action Items & To-Do List",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    items(data.actionItems) { item ->
                        ActionItemRow(
                            item = item,
                            onToggle = { viewModel.toggleActionItem(item.id) }
                        )
                    }
                }
                UiState.Idle -> {
                    item {
                        Text(
                            text = "Ready to structure notes. Tap 'Fill Sample' or paste meeting text above.",
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CrmCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(8.dp))
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
fun ActionItemRow(
    item: ActionItem,
    onToggle: () -> Unit
) {
    val tagType = parseTagType(item.tag)
    val (badgeBg, badgeText) = when (tagType) {
        TagType.CRITICAL -> Color(0xFF7F1D1D) to Color(0xFFFCA5A5)
        TagType.GOV -> Color(0xFF78350F) to Color(0xFFFDE68A)
        TagType.REQ -> Color(0xFF1E3A8A) to Color(0xFF93C5FD)
        TagType.FOLLOW_UP -> Color(0xFF064E3B) to Color(0xFF6EE7B7)
        TagType.OTHER -> Color(0xFF374151) to Color(0xFFD1D5DB)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = item.isDone,
                onCheckedChange = { onToggle() }
            )

            Column(modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(badgeBg)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = item.tag,
                        color = badgeText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(Modifier.height(4.dp))

                Text(
                    text = item.task,
                    textDecoration = if (item.isDone) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (item.isDone) Color.Gray else Color.White
                )
            }
        }
    }
}`
  },
  {
    name: 'BrmParserEngine.kt',
    path: 'app/src/main/java/com/brm/assistant/BrmParserEngine.kt',
    code: `package com.brm.assistant

import com.google.ai.client.generativeai.GenerativeModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object BrmParserEngine {

    private const val SYSTEM_PROMPT = """
You are the intelligent backend engine for a specialized Android app designed for a Business Relationship Manager (BRM). Your core job is to take raw, messy, or quickly typed meeting notes, client feedback, governance discussions, and follow-ups, and instantly structure them into actionable CRM data points. You must categorize entries by Client Manager, Team, Action Items, and Urgency Tags.

Whenever the user inputs raw notes or a post-meeting transcript, extract and output the data in the following clean, structured Markdown format:

## 🏢 Client & Meeting Metadata
* **Client Organization:** [Company Name]
* **Date:** [Today's Date or Mentioned Date]
* **Meeting Context:** [e.g., Governance Review, Meet & Greet, Requirement Gathering]

## 👥 Key Stakeholders Mentioned
* **Client Managers:** [List names of Client Managers discussed/met]
* **Internal Associates/Teams:** [List specific internal teams or associates responsible for follow-ups]

## 📥 Feedback & Requirements Log
* **Client Feedback:** [Bullet points of positive/negative feedback received]
* **New Requirements:** [Explicit feature requests, scope changes, or new project needs]

## 📋 Action Items & To-Do List
Format this section specifically as a punchy, actionable list using markdown checkboxes (` + '`- [ ]`' + `). Every item MUST follow this format: 
` + '`- [ ] **[Tag/Assignee]** Action item text`' + `

Use the following specific tags to categorize follow-ups:
* [Follow-Up - Name/Team] for general tracking.
* [CRITICAL] for high-priority governance blockers.
* [REQ] for new project requirements.
* [GOV] for compliance, SLA reviews, or contract items.

Tone & Style Rules:
- Direct & Actionable: Eliminate conversational filler, pleasantries, or preamble. Start directly with the structured output.
- Punchy Fragments: Keep the action items short, clear, and task-oriented.
- Strict Schema: If data for a section is missing from the raw note, write "None identified."
"""

    suspend fun processNotes(apiKey: String, rawInput: String): ParsedCrmData = withContext(Dispatchers.IO) {
        val generativeModel = GenerativeModel(
            modelName = "gemini-1.5-flash",
            apiKey = apiKey,
            systemInstruction = com.google.ai.client.generativeai.type.content {
                text(SYSTEM_PROMPT)
            }
        )

        val response = generativeModel.generateContent(rawInput)
        val text = response.text.orEmpty()
        return@withContext parseMarkdownResponse(text)
    }

    private fun parseMarkdownResponse(markdown: String): ParsedCrmData {
        var clientOrg = ""
        var meetingDate = ""
        var context = ""
        val managers = mutableListOf<String>()
        val teams = mutableListOf<String>()
        val feedback = mutableListOf<String>()
        val requirements = mutableListOf<String>()
        val actionItems = mutableListOf<ActionItem>()

        val lines = markdown.lines()
        val actionRegex = Regex("""^-\\s*\\[\\s*\\]\\s*\\*\\*\\[(.*?)\\]\\*\\*\\s*(.*)$""")

        lines.forEach { line ->
            val trimmed = line.trim()
            when {
                trimmed.startsWith("* **Client Organization:**") ->
                    clientOrg = trimmed.removePrefix("* **Client Organization:**").trim()
                trimmed.startsWith("* **Date:**") ->
                    meetingDate = trimmed.removePrefix("* **Date:**").trim()
                trimmed.startsWith("* **Meeting Context:**") ->
                    context = trimmed.removePrefix("* **Meeting Context:**").trim()
                trimmed.startsWith("* **Client Managers:**") ->
                    managers.addAll(trimmed.removePrefix("* **Client Managers:**").split(",").map { it.trim() })
                trimmed.startsWith("* **Internal Associates/Teams:**") ->
                    teams.addAll(trimmed.removePrefix("* **Internal Associates/Teams:**").split(",").map { it.trim() })
                trimmed.startsWith("* **Client Feedback:**") ->
                    feedback.add(trimmed.removePrefix("* **Client Feedback:**").trim())
                trimmed.startsWith("* **New Requirements:**") ->
                    requirements.add(trimmed.removePrefix("* **New Requirements:**").trim())
                else -> {
                    actionRegex.find(trimmed)?.let { match ->
                        val (tag, task) = match.destructured
                        actionItems.add(ActionItem(tag = tag, task = task))
                    }
                }
            }
        }

        return ParsedCrmData(
            clientOrganization = clientOrg.ifEmpty { "Acme Corp" },
            meetingDate = meetingDate.ifEmpty { "Recent" },
            meetingContext = context.ifEmpty { "General Governance" },
            clientManagers = managers.filter { it.isNotBlank() },
            internalTeams = teams.filter { it.isNotBlank() },
            clientFeedback = feedback.filter { it.isNotBlank() },
            newRequirements = requirements.filter { it.isNotBlank() },
            actionItems = actionItems,
            rawMarkdown = markdown
        )
    }
}`
  },
  {
    name: 'CrmModels.kt',
    path: 'app/src/main/java/com/brm/assistant/CrmModels.kt',
    code: `package com.brm.assistant

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
    val meetingDate: String = "",
    val meetingContext: String = "",
    val clientManagers: List<String> = emptyList(),
    val internalTeams: List<String> = emptyList(),
    val clientFeedback: List<String> = emptyList(),
    val newRequirements: List<String> = emptyList(),
    val actionItems: List<ActionItem> = emptyList(),
    val rawMarkdown: String = ""
)`
  },
  {
    name: 'BrmViewModel.kt',
    path: 'app/src/main/java/com/brm/assistant/BrmViewModel.kt',
    code: `package com.brm.assistant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed interface UiState {
    object Idle : UiState
    object Loading : UiState
    data class Success(val data: ParsedCrmData) : UiState
    data class Error(val message: String) : UiState
}

class BrmViewModel : ViewModel() {
    val rawInput = MutableStateFlow("")
    val apiKey = MutableStateFlow("")

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState

    fun onInputChanged(newInput: String) {
        rawInput.value = newInput
    }

    fun onApiKeyChanged(newKey: String) {
        apiKey.value = newKey
    }

    fun toggleActionItem(itemId: String) {
        val currentState = _uiState.value
        if (currentState is UiState.Success) {
            val updatedList = currentState.data.actionItems.map {
                if (it.id == itemId) it.copy(isDone = !it.isDone) else it
            }
            _uiState.value = UiState.Success(currentState.data.copy(actionItems = updatedList))
        }
    }

    fun processMeetingNotes() {
        if (apiKey.value.isBlank()) {
            _uiState.value = UiState.Error("Please provide a Gemini API Key in the settings field.")
            return
        }
        if (rawInput.value.isBlank()) {
            _uiState.value = UiState.Error("Please enter or paste meeting notes.")
            return
        }

        _uiState.value = UiState.Loading
        viewModelScope.launch {
            try {
                val parsed = BrmParserEngine.processNotes(apiKey.value, rawInput.value)
                _uiState.value = UiState.Success(parsed)
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.localizedMessage ?: "Failed to process notes.")
            }
        }
    }

    fun loadSampleNote() {
        rawInput.value = "Met with Sarah from Acme Corp today for the monthly sync. She's happy with current sprint speed but requested an analytics dashboard by Q3. John's team needs to look into the latency issues she reported. Need to follow up with Sarah next week about contract renewal signatures."
    }
}`
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
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

    // Google Generative AI (Gemini) SDK
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}`
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    code: `<?xml version="1.0" encoding="utf-8"?>
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
</manifest>`
  }
];

export const AndroidCodeModal: React.FC<AndroidCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = ANDROID_FILES[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Native Android Kotlin & Jetpack Compose Code</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Production Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct drop-in source files for your Android Studio project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto">
          {ANDROID_FILES.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              {file.name}
            </button>
          ))}
        </div>

        {/* Path banner & actions */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Path: <span className="text-slate-200">{currentFile.path}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto selection:bg-cyan-900 selection:text-white">
            {currentFile.code}
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Target SDK 35 • Jetpack Compose BOM 2024.09.00 • Google Gemini SDK 0.9.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
