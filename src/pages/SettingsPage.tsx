import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { exportData, importData } from "../data/importExport";
import { downloadJson } from "../utils/download";
import { Checkbox } from "../components/ui/checkbox";

const THEMES = [
  "system",
  "light",
  "dark",
  "cupcake",
  "emerald",
  "corporate",
  "retro",
  "valentine",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "lemonade",
  "night",
  "coffee",
  "winter",
];

const FONT_OPTIONS = [
  "system",
  "Vazirmatn",
  "IRANSansX",
  "Sahel",
  "Shabnam",
  "Estedad",
  "Inter",
  "SF Pro",
  "Roboto",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Mono",
];

export const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const [newStatus, setNewStatus] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async () => {
    const payload = await exportData();
    downloadJson(`devboard-${new Date().toISOString().slice(0, 10)}.json`, payload);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importData(payload, importMode);
      setImportError(null);
    } catch (error) {
      setImportError((error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Theme & Fonts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-base-content/60">Theme</label>
              <Select
                value={settings.theme}
                onChange={(event) => updateSettings({ theme: event.target.value })}
              >
                {THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-base-content/60">Primary Font</label>
              <Select
                value={settings.fontFamily}
                onChange={(event) => updateSettings({ fontFamily: event.target.value })}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-base-content/60">Mono Font</label>
              <Select
                value={settings.monoFont}
                onChange={(event) => updateSettings({ monoFont: event.target.value })}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-base-content/60">Calendar</label>
              <Select
                value={settings.calendar}
                onChange={(event) => updateSettings({ calendar: event.target.value as "gregorian" | "jalali" })}
              >
                <option value="gregorian">Gregorian</option>
                <option value="jalali">Jalali</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kanban Statuses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {settings.statuses.map((status, index) => (
              <div key={`${status}-${index}`} className="flex items-center gap-2">
                <Input
                  value={status}
                  onChange={(event) => {
                    const updated = [...settings.statuses];
                    updated[index] = event.target.value;
                    updateSettings({ statuses: updated });
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const updated = settings.statuses.filter((_, idx) => idx !== index);
                    if (updated.length === 0) return;
                    updateSettings({ statuses: updated });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New status"
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value)}
            />
            <Button
              onClick={() => {
                if (!newStatus.trim()) return;
                updateSettings({ statuses: [...settings.statuses, newStatus.trim()] });
                setNewStatus("");
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={settings.backupReminder}
              onCheckedChange={(checked) => updateSettings({ backupReminder: Boolean(checked) })}
            />
            Enable backup reminders
          </label>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport}>Export .json</Button>
            <Select value={importMode} onChange={(event) => setImportMode(event.target.value as "replace" | "merge")}>
              <option value="merge">Merge by IDs</option>
              <option value="replace">Replace All</option>
            </Select>
            <label className="text-sm border border-base-300 rounded-md px-3 py-2 cursor-pointer">
              Import File
              <input
                type="file"
                className="hidden"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleImport(file);
                }}
              />
            </label>
          </div>
          {importError && <div className="text-sm text-error">{importError}</div>}
        </CardContent>
      </Card>
    </div>
  );
};
