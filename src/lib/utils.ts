import { Customer } from '../domain/models';

/**
 * Checks if a customer has reached their payment cycle limit.
 * The limit is reached when total_due >= (payment_cycle * price_per_jar).
 */
export const isAtLimit = (customer: Customer | null | undefined): boolean => {
  if (!customer) return false;
  return customer.total_due >= (customer.payment_cycle * customer.price_per_jar);
};
