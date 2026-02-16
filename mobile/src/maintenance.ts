/**
 * Mifflin-St Jeor BMR, then TDEE with sedentary factor (1.2).
 * Weight in lbs, height in inches; age in years.
 * Returns null if any required value is missing.
 */
export function getMaintenanceCalories(
  age: number | null | undefined,
  sex: string | null | undefined,
  heightInches: number | null | undefined,
  weightLbs: number | null | undefined
): number | null {
  if (
    age == null ||
    sex == null ||
    String(sex).trim() === "" ||
    heightInches == null ||
    weightLbs == null ||
    heightInches <= 0 ||
    weightLbs <= 0
  ) {
    return null;
  }
  const kg = weightLbs / 2.205;
  const cm = heightInches * 2.54;
  const sexLower = String(sex).toLowerCase();
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (sexLower === "male" ? 5 : -161);
  const tdee = Math.round(bmr * 1.2);
  return tdee;
}
