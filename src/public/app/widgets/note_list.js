import TabAwareWidget from "./tab_aware_widget.js";
import NoteListRenderer from "../services/note_list_renderer.js";

const TPL = `
<div class="note-list-widget">
    <style>
    .note-list-widget {
        flex-grow: 100000;
        flex-shrink: 100000;
        min-height: 0;
        overflow: auto;
    }
    
    .note-list-widget .note-list {
        padding: 10px;
    }
    </style>
    
    <div class="note-list-widget-content">
    </div>
</div>`;

export default class NoteListWidget extends TabAwareWidget {
    isEnabled() {
        return super.isEnabled()
            && this.note.mime !== 'text/x-sqlite;schema=trilium'
            && (
                ['book', 'search', 'code'].includes(this.note.type)
                || (this.note.type === 'text' && this.note.hasChildren())
            );
    }

    doRender() {
        this.$widget = $(TPL);
        this.$content = this.$widget.find('.note-list-widget-content');
        this.contentSized();

        const observer = new IntersectionObserver(entries => {
            this.isIntersecting = entries[0].isIntersecting;

            this.checkRenderStatus();
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        observer.observe(this.$widget[0]);
    }

    checkRenderStatus() {
        if (this.isIntersecting
            && this.noteIdRefreshed === this.noteId
            && this.shownNoteId !== this.noteId) {

            this.shownNoteId = this.noteId;
            this.renderNoteList(this.note);
        }
    }

    async renderNoteList(note) {
        const noteListRenderer = new NoteListRenderer(this.$content, note, note.getChildNoteIds());
        await noteListRenderer.renderList();
    }

    noteDetailRefreshedEvent({tabId}) {
        if (!this.isTab(tabId)) {
            return;
        }

        this.noteIdRefreshed = this.noteId;

        setTimeout(() => this.checkRenderStatus(), 100);
    }

    autoBookDisabledEvent({tabContext}) {
        if (this.isTab(tabContext.tabId)) {
            this.refresh();
        }
    }

    notesReloadedEvent({noteIds}) {
        if (noteIds.includes(this.noteId)) {
            this.refresh();
        }
    }
}
