import React, { useState } from 'react';

export interface Scenario {
  scenario: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface InteractiveManualProps {
  scenarios: Scenario[];
}

const InteractiveManual: React.FC<InteractiveManualProps> = ({ scenarios }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!scenarios || scenarios.length === 0) {
    return <p className="p-4 text-center text-gray-500">No se encontraron escenarios interactivos en el documento.</p>;
  }

  const currentScenario = scenarios[currentIndex];

  const handleAnswerClick = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent changing answer
    setSelectedAnswer(index);
    if (index === currentScenario.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsFinished(false);
  };


  if (isFinished) {
    return (
      <div className="text-center p-8 bg-blue-50 rounded-lg">
        <h3 className="text-2xl font-bold text-primary">¡Has completado el repaso!</h3>
        <p className="mt-2 text-lg">
          Tu puntuación: <span className="font-bold">{score} de {scenarios.length}</span> correctas.
        </p>
        <button
          onClick={handleRestart}
          className="mt-6 bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors"
        >
          Repasar de Nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-inner bg-gray-50/50">
      <div className="mb-4">
        <p className="text-sm text-gray-500">Escenario {currentIndex + 1} de {scenarios.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div className="bg-secondary h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }}></div>
        </div>
      </div>

      <p className="text-lg font-semibold text-gray-800 mb-4">{currentScenario.scenario}</p>

      <div className="space-y-3">
        {currentScenario.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = currentScenario.correctAnswerIndex === index;
          let buttonClass = 'bg-white hover:bg-gray-100 border-gray-300';
          
          if (selectedAnswer !== null) {
            if (isCorrect) {
              buttonClass = 'bg-green-100 border-green-500 text-green-800 ring-2 ring-green-400';
            } else if (isSelected && !isCorrect) {
              buttonClass = 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-400';
            } else {
              buttonClass = 'bg-gray-100 border-gray-200 text-gray-500'; // Disabled look
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerClick(index)}
              disabled={selectedAnswer !== null}
              className={`w-full text-left p-3 border rounded-lg flex items-center space-x-4 transition-all duration-200 ${buttonClass}`}
            >
              <span className={`font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full ${isSelected || (selectedAnswer !== null && isCorrect) ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 animate-fade-in">
          <h4 className="font-bold text-yellow-800">Explicación</h4>
          <p className="text-sm text-gray-700 mt-1">{currentScenario.explanation}</p>
        </div>
      )}

      <div className="text-right mt-6">
        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {currentIndex === scenarios.length - 1 ? 'Finalizar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

export default InteractiveManual;
