import { useState } from "react";
import { Box, Text, Button, TextArea, Label, Stack } from "@twilio-paste/core";
import { DeleteIcon } from "@twilio-paste/icons/esm/DeleteIcon";
import { Note } from "../../types";
import { createNote, deleteNote } from "../../api/hubspotClient";
import { LoadingState } from "../shared/LoadingState";
import { ErrorBanner } from "../shared/ErrorBanner";

interface NotesTabProps {
  contactId: string;
  notes: Note[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function NotesTab({
  contactId,
  notes,
  loading,
  error,
  onRefresh,
}: NotesTabProps) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [body, setBody] = useState("");

  const handleCreate = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await createNote({ contactId, body });
      setBody("");
      setCreating(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading notes..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={onRefresh} />;
  }

  return (
    <Box padding="space40">
      {creating ? (
        <Stack orientation="vertical" spacing="space40">
          <Box>
            <Label htmlFor="note-body" required>
              Note
            </Label>
            <TextArea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter note..."
            />
          </Box>
          <Box display="flex" columnGap="space30">
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              disabled={!body.trim()}
            >
              Add Note
            </Button>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </Box>
        </Stack>
      ) : (
        <>
          <Box marginBottom="space40">
            <Button variant="secondary" size="small" onClick={() => setCreating(true)}>
              + Add Note
            </Button>
          </Box>
          {notes.length === 0 ? (
            <Text as="p" color="colorTextWeak">
              No notes found
            </Text>
          ) : (
            <Stack orientation="vertical" spacing="space30">
              {notes.map((note) => (
                <NoteRow key={note.id} note={note} onDelete={onRefresh} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}

function NoteRow({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this note?")) return;
    setDeleting(true);
    try {
      await deleteNote(note.id);
      onDelete();
    } catch (err) {
      console.error("Failed to delete note:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      padding="space30"
      borderWidth="borderWidth10"
      borderStyle="solid"
      borderColor="colorBorderWeaker"
      borderRadius="borderRadius20"
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Text as="p" fontSize="fontSize20" color="colorTextWeak">
          {new Date(note.timestamp).toLocaleDateString()}
        </Text>
        <Button
          variant="destructive_icon"
          size="reset"
          onClick={handleDelete}
          loading={deleting}
        >
          <DeleteIcon decorative={false} title="Delete note" size="sizeIcon20" />
        </Button>
      </Box>
      <Text as="p" marginTop="space10" whiteSpace="pre-wrap">
        {note.body}
      </Text>
    </Box>
  );
}
