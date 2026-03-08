import { Routes } from '@angular/router';
import {Home} from './pages/home/home';
import {DiagnosticTest} from './pages/diagnostic-test/diagnostic-test';
import {Levels} from './pages/levels/levels';
import {VideoLesson} from './pages/video-lesson/video-lesson';
import {Shadowing} from './pages/shadowing/shadowing';
import {Grammar} from './pages/grammar/grammar';
import {FourSkills} from './pages/four-skills/four-skills';
import {ModuleTest} from './pages/module-test/module-test';
import { UserProfile } from './pages/user-profile/user-profile';
import {authGuard} from './core/guards/auth-guard';
import {LevelDashboard} from './pages/level-dashboard/level-dashboard';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  {path:"diagnostic",component:DiagnosticTest},
  {path:'levels',component:Levels},
  {path:'levels/:levelId', component:LevelDashboard},
  {path:'levels/:levelId/video/:lessonId', component:VideoLesson},
  { path: 'levels/:levelId/shadowing/:taskId', component: Shadowing },
  { path: 'levels/:levelId/grammar/:topicId', component: Grammar },
  { path: 'levels/:levelId/skills/:skillType', component: FourSkills },
  { path: 'levels/:levelId/test', component: ModuleTest },
  { path: 'profile', component: UserProfile , canActivate: [authGuard] },
  { path: '**', redirectTo: '/home' }
];
