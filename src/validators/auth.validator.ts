/**
 * @fileoverview Authentication validators for request validation using express-validator.
 * @module validators/auth.validator
 * @requires express-validator
 * @requires express
 */

import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Validation chain for user signup/registration.
 * 
 * @constant {Array<ValidationChain>} signupValidation
 * @description
 * Validates the following fields:
 * - email: Required, must be valid email format, normalized
 * - password: Required, min 8 characters, must contain uppercase, lowercase, number, and special character
 * - nickname: Optional, if provided must be at least 2 characters
 * 
 * @example
 * // Usage in routes:
 * router.post('/signup', signupValidation, validate, signupController);
 * 
 * @see {@link validate} Validation result handler
 */
export const signupValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/
    )
    .withMessage(
      "La contraseña debe contener al menos una mayúscula, minúscula, número y carácter especial"
    ),

  body("nickname")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("El nickname debe tener al menos 2 caracteres"),
];

/**
 * Validation chain for user login.
 * 
 * @constant {Array<ValidationChain>} loginValidation
 * @description
 * Validates the following fields (supports both English and Spanish):
 * - email/correoElectronico: Required, must be valid email format
 * - password/contraseña: Required, non-empty
 * 
 * @example
 * // Usage in routes:
 * router.post('/login', loginValidation, validate, loginController);
 * 
 * @see {@link validate} Validation result handler
 */
export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido"),

  body("password").notEmpty().withMessage("La contraseña es requerida"),

  // También acepta los campos en español para compatibilidad
  body("correoElectronico")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido"),

  body("contraseña")
    .optional()
    .notEmpty()
    .withMessage("La contraseña es requerida"),
];

/**
 * Middleware to check validation results and handle errors.
 * 
 * @function validate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void} Calls next() if validation passes, or sends error response
 * 
 * @description
 * Checks validation results from express-validator chains.
 * If errors exist, returns 400 status with error array.
 * If no errors, calls next() to continue to controller.
 * 
 * @example
 * // Error response (400):
 * {
 *   "errors": [
 *     {
 *       "type": "field",
 *       "value": "",
 *       "msg": "El correo electrónico es requerido",
 *       "path": "email",
 *       "location": "body"
 *     }
 *   ]
 * }
 * 
 * @see {@link signupValidation} Signup validation chain
 * @see {@link loginValidation} Login validation chain
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
