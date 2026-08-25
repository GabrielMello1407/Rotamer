import 'server-only';
import { analyze, configureRDKit, depict, type AnalysisResult } from '@rotamer/core';
import { packageFactory } from '@rotamer/core/chemistry/node';

/**
 * O mesmo motor, do lado do servidor.
 *
 * A página pública de molécula é renderizada no servidor — é ela que traz busca
 * orgânica e que faz o link colar bonito no grupo da turma. Quem responde
 * continua sendo o RDKit: aqui ele carrega do pacote npm, com o WebAssembly ao
 * lado do módulo, em vez do script servido ao navegador.
 *
 * É esta a fronteira que a Fase 2 vai reaproveitar para reavaliar a `spec` da
 * missão antes de gravar qualquer tentativa. Nunca confie na avaliação do
 * cliente.
 */
configureRDKit({ loadFactory: packageFactory });

export function analyzeOnServer(input: string): Promise<AnalysisResult> {
  return analyze(input);
}

export function depictOnServer(input: string): Promise<string | null> {
  return depict(input, { width: 460, height: 340 });
}
