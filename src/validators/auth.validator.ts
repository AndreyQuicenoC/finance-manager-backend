import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const signupValidation = [
  body("nombres")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),

  body("apellidos")
    .trim()
    .notEmpty()
    .withMessage("Los apellidos son requeridos")
    .isLength({ min: 2 })
    .withMessage("Los apellidos deben tener al menos 2 caracteres"),

  body("edad")
    .isInt({ min: 18, max: 120 })
    .withMessage("La edad debe ser un número entre 18 y 120"),

  body("correoElectronico")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),

  body("contraseña")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/
    )
    .withMessage(
      "La contraseña debe contener al menos una mayúscula y un carácter especial"
    ),

  body("confirmarContraseña").custom((value, { req }) => {
    if (value !== req.body.contraseña) {
      throw new Error("Las contraseñas no coinciden");
    }
    return true;
  }),
];

export const loginValidation = [
  body("correoElectronico")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido"),

  body("contraseña").notEmpty().withMessage("La contraseña es requerida"),
];

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
