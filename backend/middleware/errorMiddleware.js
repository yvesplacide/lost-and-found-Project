// backend/middleware/errorMiddleware.js

// Middleware pour gérer les erreurs 404 (Not Found)
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Passe l'erreur au prochain middleware
};

// Middleware générique pour gérer les erreurs
const errorHandler = (err, req, res, next) => {
    // Si le statut est 200 (OK), mais qu'une erreur a été lancée, changer en 500 (Internal Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        // En mode développement, inclure la pile d'erreurs pour le débogage
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };