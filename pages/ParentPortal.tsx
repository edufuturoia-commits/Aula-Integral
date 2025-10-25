import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Student, Teacher, Resource, SubjectGrades, InstitutionProfileData, Citation, Incident, Announcement, InboxConversation, DesempenoDescriptor, Conversation, Guardian, Message } from '../types';
import { CitationStatus, Role, AcademicPeriod, Desempeno } from '../types';
import ReportCardModal from '../components/ReportCardModal';
import { ACADEMIC_