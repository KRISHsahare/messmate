/** Every student-facing server action returns this shape. */
export type ActionResult = { ok: true } | { ok: false; message: string };

export function actionOk(): ActionResult {
  return { ok: true };
}

export function actionError(message: string): ActionResult {
  return { ok: false, message };
}
