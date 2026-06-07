from typing import List, Tuple
from src.core.problem import GameProblem
import copy

class TicTacToeState:
    def __init__(self, board=None, is_x_turn=True):
        self.board = board if board else [[' ' for _ in range(3)] for _ in range(3)]
        self.is_x_turn = is_x_turn

    def get_winner(self) -> str:
        b = self.board
        for i in range(3):
            if b[i][0] == b[i][1] == b[i][2] != ' ': return b[i][0]
            if b[0][i] == b[1][i] == b[2][i] != ' ': return b[0][i]
        if b[0][0] == b[1][1] == b[2][2] != ' ': return b[0][0]
        if b[0][2] == b[1][1] == b[2][0] != ' ': return b[0][2]
        return None

    def get_winning_line(self) -> List[Tuple[int, int]]:
        b = self.board
        for i in range(3):
            if b[i][0] == b[i][1] == b[i][2] != ' ': return [(i,0), (i,1), (i,2)]
            if b[0][i] == b[1][i] == b[2][i] != ' ': return [(0,i), (1,i), (2,i)]
        if b[0][0] == b[1][1] == b[2][2] != ' ': return [(0,0), (1,1), (2,2)]
        if b[0][2] == b[1][1] == b[2][0] != ' ': return [(0,2), (1,1), (2,0)]
        return None

    def is_full(self) -> bool:
        return all(cell != ' ' for row in self.board for cell in row)
        
    def __str__(self):
        return "\n-----\n".join(["|".join(row) for row in self.board])

class TicTacToeProblem(GameProblem[TicTacToeState, Tuple[int, int]]):
    def get_initial_state(self) -> TicTacToeState:
        return TicTacToeState()

    def get_possible_actions(self, state: TicTacToeState) -> List[Tuple[int, int]]:
        actions = []
        for r in range(3):
            for c in range(3):
                if state.board[r][c] == ' ':
                    actions.append((r, c))
        return actions

    def get_next_state(self, state: TicTacToeState, action: Tuple[int, int]) -> TicTacToeState:
        new_board = copy.deepcopy(state.board)
        new_board[action[0]][action[1]] = 'X' if state.is_x_turn else 'O'
        return TicTacToeState(new_board, not state.is_x_turn)

    def is_terminal(self, state: TicTacToeState) -> bool:
        return state.get_winner() is not None or state.is_full()

    def evaluate(self, state: TicTacToeState) -> float:
        winner = state.get_winner()
        if winner == 'X': return 1.0  # Max player wins
        if winner == 'O': return -1.0 # Min player wins
        return 0.0

    def is_max_turn(self, state: TicTacToeState) -> bool:
        return state.is_x_turn
