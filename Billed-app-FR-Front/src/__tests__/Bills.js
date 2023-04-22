/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import {screen, waitFor, fireEvent} from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("When we click on the new expense report button we get the form", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      fireEvent.click(buttonNewBill)
      await waitFor(() => screen.getByTestId('title-new-bill'))
      const titleNewBill = screen.getByTestId('title-new-bill')

      expect(titleNewBill).toHaveTextContent('Envoyer une note de frais')
    })

    test("icon", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getAllByTestId('icon-eye'))
      const eyeIcon = screen.getAllByTestId('icon-eye')[1]
      userEvent.click(eyeIcon)
      // console.log(windowIcon)
      // document.body.innerHTML = BillsUI({ data: bills })
      // const eyeIcon = screen.getAllByTestId('icon-eye')[1]
      // fireEvent.click(eyeIcon)
      // await waitFor(() => screen.getByRole('dialog', { hidden: true }))
      // const imgBalise = screen.getByAltText('Bill')
      // expect(imgBalise).toHaveAttribute('src', 'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a')
    })

    afterEach(() => {
      jest.dontMock("../app/Store.js");
      jest.resetModules();
    });
    
  })
})
