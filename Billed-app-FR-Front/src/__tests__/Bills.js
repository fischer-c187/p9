/**
 * @jest-environment jsdom
 */
require('jquery-modal');
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/Store';
import router from '../app/Router.js';
import * as formatModule from '../app/format.js';

jest.mock('../app/Store.js', () => mockStore);

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });
    test("fetches bills from mock API GET", async () => {
      const tableBody = screen.getByTestId('tbody')
      expect(tableBody).toBeTruthy()
      expect(tableBody.childElementCount).toBe(4)
    })
    test('Then bill icon in vertical layout should be highlighted', async () => {
      const windowIcon = screen.getByTestId('icon-window');
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon');
    });
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test('Then, after simulating a click on the button, the form for a new bill is displayed', async () => {
      const buttonNewBill = screen.getByTestId('btn-new-bill');
      fireEvent.click(buttonNewBill);
      await waitFor(() => screen.getByTestId('title-new-bill'));
      const titleNewBill = screen.getByTestId('title-new-bill');

      expect(titleNewBill).toHaveTextContent('Envoyer une note de frais');
    });

    test('Then, clicking on the eye icon displays a modal with the image of the bill.', async () => {
      const eyeIcon = screen.getAllByTestId('icon-eye')[0];
      userEvent.click(eyeIcon);
      await waitFor(() => screen.getByRole('dialog', { hidden: true }));
      const imgBalise = screen.getByAltText('Bill');
      const srcImgCible = await mockStore.bills().list();
      srcImgCible.sort((a, b) => new Date(b.date) - new Date(a.date));
      expect(imgBalise).toHaveAttribute('src', srcImgCible[0].fileUrl);
    });
  });

  describe("When the promise doesn't resolve", () => {
    let originalBills;

    beforeEach(() => {
      originalBills = mockStore.bills;
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);

      router();
    });

    afterEach(() => {
      mockStore.bills = originalBills;
    });

    test('Should display error 500', async () => {
      mockStore.bills = jest.fn(() => ({
        list: () => Promise.reject(new Error('Erreur 500')),
      }));

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('error-message'));
      const errorContainer = screen.getByTestId('error-message');

      expect(errorContainer).toHaveTextContent('Erreur 500');
    });

    test('Should display error 404', async () => {
      mockStore.bills = jest.fn(() => ({
        list: () => Promise.reject(new Error('Erreur 404')),
      }));

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('error-message'));
      const errorContainer = screen.getByTestId('error-message');

      expect(errorContainer).toHaveTextContent('Erreur 404');
    });
  });

  describe('When corrupted data is introduced', () => {
    let consoleLogSpy;
    let formatDateSpy;
    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log');
      consoleLogSpy.mockImplementation(() => {});
      formatDateSpy = jest.spyOn(formatModule, 'formatDate');
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      formatDateSpy.mockRestore();
    });
    test('Then an error should be displayed in the log', async () => {

      formatDateSpy.mockImplementation(() => {
        throw new Error('formatDate error')
      })

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      await window.onNavigate(ROUTES_PATH.Bills);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        new Error('formatDate error'),
        'for',
        expect.any(Object)
      );

    });
  });
});
