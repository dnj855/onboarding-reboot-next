import { Router } from 'express';

// Import all route modules
import usersRouter from './users.routes';
import authRouter from './auth.routes';

const router: Router = Router();

// =============================================================================
// API ROUTES REGISTRATION
// =============================================================================

// Authentication routes
router.use('/auth', authRouter);

// Users routes
router.use('/users', usersRouter);

// Future routes will be added here:
// router.use('/companies', companiesRouter);
// router.use('/teams', teamsRouter);
// router.use('/onboarding', onboardingRouter);

export default router;