export type ThreadStatus = "open" | "closed";
export type MessageRole = "D" | "H" | "A";

export type ThreadRef =
  | { type: "prev"; count: number }
  | { type: "file" };

export type Range = {
  start: number;
  end: number;
};

export type ParseError = {
  message: string;
  range?: Range;
  threadId?: string;
};

export type ThreadMessage = {
  id: string;
  role: MessageRole;
  ts?: string;
  body: string;
  rawBody: string;
  raw: string;
  range: Range;
  meta: Record<string, string>;
};

export type ThreadHeader = {
  id: string;
  status: ThreadStatus;
  ref: ThreadRef;
  raw: string;
  range: Range;
  meta: Record<string, string>;
};

export type ThreadFooter = {
  id?: string;
  raw: string;
  range: Range;
  meta: Record<string, string>;
};

export type Thread = {
  id: string;
  status: ThreadStatus;
  ref: ThreadRef;
  messages: ThreadMessage[];
  pending: boolean;
  header: ThreadHeader;
  footer?: ThreadFooter;
  raw?: string;
  range: Range;
  errors?: ParseError[];
  dirty?: boolean;
};

export type ParseResult = {
  threads: Thread[];
  errors: ParseError[];
};
