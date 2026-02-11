import { supabase } from '../lib/supabase';

export async function submitQuestionFlag(
  userId: string,
  questionId: string,
  description: string,
): Promise<void> {
  const { error } = await supabase
    .from('question_flags')
    .insert({ user_id: userId, question_id: questionId, description });
  if (error) throw error;
}
