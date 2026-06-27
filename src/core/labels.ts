export type CommentLabel =
  | 'not_problematic'
  | 'toxicity'
  | 'insult'
  | 'dehumanization'
  | 'racism'
  | 'antisemitism'
  | 'conspiracy_narrative'
  | 'false_or_unverified_claim'
  | 'right_extremist_narrative'
  | 'coordinated_pattern'
  | 'dismissive_framing';

export const LABEL_DESCRIPTIONS: Record<CommentLabel, string> = {
  not_problematic: 'No harmful patterns detected in this comment',
  toxicity: 'Contains abusive or highly offensive language',
  insult: 'Contains direct personal insults or attacks',
  dehumanization: 'Uses language that strips people of their humanity',
  racism: 'Contains racially discriminatory language or stereotypes',
  antisemitism: 'Contains antisemitic tropes, stereotypes, or conspiracy framings',
  conspiracy_narrative: 'Promotes unsubstantiated conspiracy theories',
  false_or_unverified_claim: 'Makes assertions that appear unverified or presented without evidence',
  right_extremist_narrative: 'Contains markers associated with far-right extremist narratives',
  coordinated_pattern: 'Shows signs of coordinated or inauthentic behavior',
  dismissive_framing: 'Dismisses critics of a policy or group using contemptuous or delegitimizing language',
};
