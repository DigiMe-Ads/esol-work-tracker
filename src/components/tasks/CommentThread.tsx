import { useState, type FormEvent } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Badges';
import { useAuth } from '@/context/AuthContext';
import { usePeople } from '@/context/PeopleContext';
import { timeAgo } from '@/lib/format';
import type { Comment } from '@/types';

interface Props {
  comments: Comment[];
  onAdd: (body: string) => Promise<boolean>;
  onRemove: (id: string) => void;
}

/** Discussion under a task: updates, questions, hand-over notes. */
export function CommentThread({ comments, onAdd, onRemove }: Props) {
  const { user, isAdmin } = useAuth();
  const { nameOf } = usePeople();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    if (await onAdd(body.trim())) setBody('');
    setBusy(false);
  };

  return (
    <section>
      <div className="section-title">
        <MessageSquare size={17} /> Comments <span className="count">{comments.length}</span>
      </div>
      {comments.length === 0 && <p className="small faint">No comments yet. Post an update for the team.</p>}
      {comments.map((c) => {
        const author = nameOf(c.author_id);
        return (
          <div key={c.id} className="comment">
            <Avatar name={author} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row small" style={{ marginBottom: 4 }}>
                <span className="strong">{author}</span>
                <span className="faint">{timeAgo(c.created_at)}</span>
                <span className="spacer" />
                {(isAdmin || c.author_id === user?.id) && (
                  <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => onRemove(c.id)} aria-label="Delete comment">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          </div>
        );
      })}
      <form className="stack" style={{ marginTop: 10, gap: 8 }} onSubmit={submit}>
        <textarea
          className="textarea"
          style={{ minHeight: 70 }}
          placeholder="Write a comment… (Ctrl+Enter to post)"
          value={body}
          maxLength={4000}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && submit(e)}
        />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn--primary btn--sm" disabled={busy || !body.trim()}>
            <Send size={14} /> Post
          </button>
        </div>
      </form>
    </section>
  );
}
