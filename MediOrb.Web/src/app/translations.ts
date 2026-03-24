export type Language = 'English' | 'Hindi' | 'Spanish';

export interface Translations {
  welcome: {
    title: string; subtitle: string; description: string;
    featureAI: string; featureAIDesc: string;
    featureVoice: string; featureVoiceDesc: string;
    featureSecure: string; featureSecureDesc: string;
    cta: string; footer: string;
  };
  registration: {
    title: string; subtitle: string;
    name: string; namePlaceholder: string;
    age: string; agePlaceholder: string;
    gender: string; genderMale: string; genderFemale: string; genderOther: string;
    contact: string; contactPlaceholder: string;
    email: string; emailPlaceholder: string;
    btn: string;
  };
  symptoms: {
    title: string; greeting: string; placeholder: string;
    btn: string; analyzing: string;
    listenLabel: string; idleLabel: string;
    quickSelect: string[];
  };
  triage: {
    title: string; subtitle: string; loadingTitle: string; loadingSubtitle: string;
    doctorLabel: string; reasoningLabel: string; testsLabel: string; waitLabel: string;
    availableLabel: string; busyLabel: string; btn: string;
  };
  confirmation: {
    title: string; subtitle: string;
    patientId: string; appointmentId: string;
    priority: string; location: string; wait: string; doctor: string;
    dispatchTitle: string;
    smsLabel: string; emailLabel: string;
    downloadBtn: string; resetBtn: string;
  };
}

export const translations: Record<Language, Translations> = {
  English: {
    welcome: {
      title: 'MediOrb', subtitle: 'AI-powered hospital check-in & triage',
      description: "Tell us your symptoms and we'll route you to the right specialist — in under a minute.",
      featureAI: 'AI Triage', featureAIDesc: 'Instant specialist routing',
      featureVoice: 'Voice Input', featureVoiceDesc: 'Describe symptoms naturally',
      featureSecure: 'Secure & Fast', featureSecureDesc: 'Under 60 seconds',
      cta: 'Start Check-in', footer: 'AI-Powered · Voice Enabled',
    },
    registration: {
      title: 'Patient Registration', subtitle: 'Basic details for your medical record',
      name: 'Full Name', namePlaceholder: 'Enter your full name',
      age: 'Age', agePlaceholder: 'Years',
      gender: 'Gender', genderMale: 'Male', genderFemale: 'Female', genderOther: 'Other',
      contact: 'Phone Number', contactPlaceholder: '10-digit mobile number',
      email: 'Email Address (Optional)', emailPlaceholder: 'To receive your report',
      btn: 'Next: Describe Symptoms',
    },
    symptoms: {
      title: 'Tell me your symptoms',
      greeting: 'Hello {name}, how can I help you today?',
      placeholder: 'Describe how you feel or use the voice assistant…',
      btn: 'Analyze with AI', analyzing: 'Analyzing your symptoms…',
      listenLabel: 'Listening…', idleLabel: 'Tap mic or type',
      quickSelect: ['Fever', 'Headache', 'Cough', 'Chest Pain', 'Stomach Ache', 'Broken Bone', 'Skin Rash', 'Eye Irritation'],
    },
    triage: {
      title: 'AI Analysis Complete', subtitle: 'Recommended specialist & next steps',
      loadingTitle: 'Analyzing your symptoms', loadingSubtitle: 'Our AI is matching you with the right specialist…',
      doctorLabel: 'Assigned Doctor', reasoningLabel: 'AI Recommendation',
      testsLabel: 'Suggested Diagnostics', waitLabel: 'Est. Wait',
      availableLabel: 'Available', busyLabel: 'Busy',
      btn: 'Confirm Appointment',
    },
    confirmation: {
      title: 'Check-in Complete!', subtitle: 'Your appointment has been confirmed.',
      patientId: 'Patient ID', appointmentId: 'Appointment ID',
      priority: 'Priority', location: 'Location', wait: 'Est. Wait', doctor: 'Doctor',
      dispatchTitle: 'Notification Dispatch',
      smsLabel: 'SMS to Patient', emailLabel: 'Email to Patient',
      downloadBtn: 'Download Report', resetBtn: 'New Patient',
    },
  },

  Hindi: {
    welcome: {
      title: 'MediOrb', subtitle: 'AI-संचालित हॉस्पिटल चेक-इन और ट्राइएज',
      description: 'अपने लक्षण बताएं और हम एक मिनट में आपको सही विशेषज्ञ के पास भेजेंगे।',
      featureAI: 'AI ट्राइएज', featureAIDesc: 'तुरंत विशेषज्ञ रूटिंग',
      featureVoice: 'वॉयस इनपुट', featureVoiceDesc: 'स्वाभाविक रूप से बोलें',
      featureSecure: 'सुरक्षित और तेज़', featureSecureDesc: '60 सेकंड से कम',
      cta: 'चेक-इन शुरू करें', footer: 'AI-संचालित · वॉयस सक्षम',
    },
    registration: {
      title: 'रोगी पंजीकरण', subtitle: 'आपके मेडिकल रिकॉर्ड के लिए बुनियादी विवरण',
      name: 'पूरा नाम', namePlaceholder: 'अपना पूरा नाम दर्ज करें',
      age: 'आयु', agePlaceholder: 'वर्ष',
      gender: 'लिंग', genderMale: 'पुरुष', genderFemale: 'महिला', genderOther: 'अन्य',
      contact: 'फोन नंबर', contactPlaceholder: '10-अंकीय मोबाइल नंबर',
      email: 'ईमेल पता (वैकल्पिक)', emailPlaceholder: 'रिपोर्ट प्राप्त करने के लिए',
      btn: 'अगला: लक्षणों का वर्णन करें',
    },
    symptoms: {
      title: 'अपने लक्षण बताएं',
      greeting: 'नमस्ते {name}, आज मैं आपकी कैसे मदद कर सकता हूँ?',
      placeholder: 'बताएं कि आप कैसा महसूस कर रहे हैं या वॉयस असिस्टेंट का उपयोग करें…',
      btn: 'AI से विश्लेषण करें', analyzing: 'आपके लक्षणों का विश्लेषण हो रहा है…',
      listenLabel: 'सुन रहा हूँ…', idleLabel: 'माइक टैप करें या टाइप करें',
      quickSelect: ['बुखार', 'सिरदर्द', 'खांसी', 'सीने में दर्द', 'पेट दर्द', 'चोट', 'चकत्ते', 'आंखों में जलन'],
    },
    triage: {
      title: 'AI विश्लेषण पूर्ण', subtitle: 'अनुशंसित विशेषज्ञ और अगले कदम',
      loadingTitle: 'आपके लक्षणों का विश्लेषण', loadingSubtitle: 'AI सही विशेषज्ञ ढूंढ रहा है…',
      doctorLabel: 'निर्धारित डॉक्टर', reasoningLabel: 'AI अनुशंसा',
      testsLabel: 'सुझाए गए परीक्षण', waitLabel: 'अनुमानित प्रतीक्षा',
      availableLabel: 'उपलब्ध', busyLabel: 'व्यस्त',
      btn: 'अपॉइंटमेंट की पुष्टि करें',
    },
    confirmation: {
      title: 'चेक-इन पूर्ण!', subtitle: 'आपका अपॉइंटमेंट कन्फर्म हो गया है।',
      patientId: 'रोगी आईडी', appointmentId: 'अपॉइंटमेंट आईडी',
      priority: 'प्राथमिकता', location: 'स्थान', wait: 'प्रतीक्षा', doctor: 'डॉक्टर',
      dispatchTitle: 'सूचना प्रेषण',
      smsLabel: 'रोगी को SMS', emailLabel: 'रोगी को Email',
      downloadBtn: 'रिपोर्ट डाउनलोड करें', resetBtn: 'नया रोगी',
    },
  },

  Spanish: {
    welcome: {
      title: 'MediOrb', subtitle: 'Registro hospitalario y triaje con IA',
      description: 'Cuéntanos tus síntomas y te dirigiremos al especialista correcto en menos de un minuto.',
      featureAI: 'Triaje IA', featureAIDesc: 'Derivación instantánea a especialista',
      featureVoice: 'Entrada de Voz', featureVoiceDesc: 'Describe síntomas naturalmente',
      featureSecure: 'Seguro y Rápido', featureSecureDesc: 'En menos de 60 segundos',
      cta: 'Iniciar Registro', footer: 'IA Potenciada · Voz Habilitada',
    },
    registration: {
      title: 'Registro del Paciente', subtitle: 'Detalles básicos para su historial médico',
      name: 'Nombre Completo', namePlaceholder: 'Ingrese su nombre completo',
      age: 'Edad', agePlaceholder: 'Años',
      gender: 'Género', genderMale: 'Masculino', genderFemale: 'Femenino', genderOther: 'Otro',
      contact: 'Número de Teléfono', contactPlaceholder: 'Número móvil de 10 dígitos',
      email: 'Correo Electrónico (Opcional)', emailPlaceholder: 'Para recibir su informe',
      btn: 'Siguiente: Describir Síntomas',
    },
    symptoms: {
      title: 'Cuéntame tus síntomas',
      greeting: 'Hola {name}, ¿cómo te sientes hoy?',
      placeholder: 'Describe cómo te sientes o usa el asistente de voz…',
      btn: 'Analizar con IA', analyzing: 'Analizando tus síntomas…',
      listenLabel: 'Escuchando…', idleLabel: 'Toca el mic o escribe',
      quickSelect: ['Fiebre', 'Dolor de cabeza', 'Tos', 'Dolor de pecho', 'Dolor de estómago', 'Hueso roto', 'Sarpullido', 'Irritación ocular'],
    },
    triage: {
      title: 'Análisis IA Completo', subtitle: 'Especialista recomendado y próximos pasos',
      loadingTitle: 'Analizando tus síntomas', loadingSubtitle: 'La IA está buscando el especialista adecuado…',
      doctorLabel: 'Doctor Asignado', reasoningLabel: 'Recomendación IA',
      testsLabel: 'Pruebas Sugeridas', waitLabel: 'Espera Est.',
      availableLabel: 'Disponible', busyLabel: 'Ocupado',
      btn: 'Confirmar Cita',
    },
    confirmation: {
      title: '¡Registro Completo!', subtitle: 'Tu cita ha sido confirmada.',
      patientId: 'ID del Paciente', appointmentId: 'ID de la Cita',
      priority: 'Prioridad', location: 'Ubicación', wait: 'Espera', doctor: 'Doctor',
      dispatchTitle: 'Despacho de Notificaciones',
      smsLabel: 'SMS al Paciente', emailLabel: 'Email al Paciente',
      downloadBtn: 'Descargar Informe', resetBtn: 'Nuevo Paciente',
    },
  },
};
