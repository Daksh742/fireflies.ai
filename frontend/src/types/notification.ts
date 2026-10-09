export type NotificationType =
  | 'meeting_created'
  | 'meeting_updated'
  | 'meeting_deleted'
  | 'action_item_added'
  | 'action_item_updated'
  | 'action_item_completed'
  | 'action_item_reopened'
  | 'action_item_deleted'
  | 'changes_saved'
  | 'copied_to_clipboard'
  | 'operation_failed';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  timestamp: string; // ISO String
  read: boolean;
}

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}
