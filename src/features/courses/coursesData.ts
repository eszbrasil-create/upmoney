export type CourseId = 'course1' | 'course2' | 'course3'

export type CourseModule = {
  id: number
  title: string
  hasPdf: boolean
}

export type CourseData = {
  id: CourseId
  title: string
  duration: string
  modules: CourseModule[]
  pdfPrefix: string
}

export const COURSES: Record<CourseId, CourseData> = {
  course1: {
    id: 'course1',
    title: 'Meu primeiro dividendo',
    duration: '3h 40min',
    pdfPrefix: 'meu_primeiro_dividendo',
    modules: [
      { id: 1, title: 'Apresentação do curso (1 to 1)', hasPdf: true },
      { id: 2, title: 'Configuração mental', hasPdf: true },
      { id: 3, title: 'Renda fixa', hasPdf: true },
      { id: 4, title: 'Renda variável', hasPdf: true },
      { id: 5, title: 'FIIs - Fundos imobiliários', hasPdf: true },
      { id: 6, title: 'Dividendos', hasPdf: true },
      { id: 7, title: 'Estratégia de renda passiva', hasPdf: true },
      { id: 8, title: 'UpControl (1 to 1)', hasPdf: false },
      { id: 9, title: 'Meu primeiro dividendo (1 to 1)', hasPdf: false },
    ],
  },
  course2: {
    id: 'course2',
    title: 'Configuração mental',
    duration: '2h 10min',
    pdfPrefix: 'configuracao_mental',
    modules: [
      { id: 1, title: 'Como o cérebro funciona', hasPdf: true },
      { id: 2, title: 'Quem você é com dinheiro', hasPdf: true },
      { id: 3, title: 'Escolhas que constroem o futuro', hasPdf: true },
      { id: 4, title: 'Estabilidade emocional', hasPdf: true },
      { id: 5, title: 'Construção do mindset investidor', hasPdf: true },
      { id: 6, title: 'Dividendo, Símbolo de transformação', hasPdf: true },
    ],
  },
  course3: {
    id: 'course3',
    title: 'Previdência privada',
    duration: '1h 10min',
    pdfPrefix: 'previdencia_privada',
    modules: [
      {
        id: 1,
        title:
          'Módulo completo - Previdência Privada (PGBL vs VGBL, taxas e tributação)',
        hasPdf: true,
      },
    ],
  },
}

