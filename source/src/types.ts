export type BlockType = 'text'|'h1'|'h2'|'h3'|'bulleted'|'numbered'|'todo'|'quote'|'callout'|'divider'|'code'|'table'|'image'|'pdf'|'database';
export type ColType = 'text'|'select'|'checkbox'|'date'|'person'|'number';
export interface DBColumn { id: string; name: string; type: ColType; options?: { label: string; color: string }[]; }
export interface DBRow { id: string; cells: Record<string, any>; }
export interface DBData { columns: DBColumn[]; rows: DBRow[]; view: 'table'|'board'|'gallery'; groupBy?: string; title?: string; }
export interface Block { id: string; type: BlockType; text: string; checked?: boolean; rows?: string[][]; src?: string; name?: string; db?: DBData; }
export interface Page { id: string; parentId: string | null; title: string; icon: string; cover: string; blocks: Block[]; favorite: boolean; trashed: boolean; collapsed?: boolean; isProject?: boolean; order: number; createdAt: number; updatedAt: number; }
export interface Member { id: string; name: string; color: string; emails?: string[]; }
export interface Comment { id: string; author: string; authorName: string; text: string; ts: number; mentions: string[]; }
export interface Subtask { id: string; text: string; done: boolean; }
export type Status = 'backlog'|'todo'|'doing'|'blocked'|'done';
export type Priority = 'alta'|'media'|'baja';
export interface Task { id: string; projectId: string; title: string; status: Status; priority: Priority; assignee: string; due: string; labels: string[]; notes: string; comments: Comment[]; subtasks?: Subtask[]; order: number; createdAt: number; }
export type PostStatus = 'idea'|'guion'|'grabado'|'editado'|'publicado';
export interface Post { id: string; title: string; platform: string; status: PostStatus; date: string; assignee: string; notes: string; order: number; }
export interface Movement { id: string; date: string; concept: string; category: string; type: 'ingreso'|'gasto'; amount: number; iva: number; who: string; notes?: string; }
export interface Contact { id: string; name: string; email: string; phone: string; company: string; role: string; status: string; notes: string; }
export interface EventItem { id: string; title: string; date: string; color: string; notes: string; }
export interface Metric { id: string; date: string; channel: string; metric: string; value: number; }
export interface Sale { id: string; date: string; type: 'anuario'|'publicidad'; concept: string; units: number; amount: number; iva: number; who: string; }
export interface DB { members: Member[]; pages: Page[]; tasks: Task[]; finances: Movement[]; posts: Post[]; contacts: Contact[]; events: EventItem[]; metrics: Metric[]; sales: Sale[]; }
