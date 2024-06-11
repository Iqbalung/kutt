import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { CopyToClipboard } from "react-copy-to-clipboard";
import React, { FC, useState, useEffect } from "react";
import { useFormState } from "react-use-form-state";
import { Flex } from "rebass/styled-components";
import styled, { css } from "styled-components";
import { ifProp } from "styled-tools";

import { errorMessage } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { User } from "../store/users";
import { Checkbox, Select, TextInput } from "./Input";
import { NavButton, Button } from "./Button";
import { Col } from "./Layout";
import Text, { H2, Span } from "./Text";
import { useMessage } from "../hooks";
import Animation from "./Animation";
import { Colors } from "../consts";
import Tooltip from "./Tooltip";
import Table from "./Table";
import ALink from "./ALink";
import Modal from "./Modal";
import Icon from "./Icon";

const Tr = styled(Flex).attrs({ as: "tr", px: [12, 12, 2] })``;
const Th = styled(Flex)``;
Th.defaultProps = { as: "th", flexBasis: 0, py: [12, 12, 3], px: [12, 12, 3] };

const Td = styled(Flex)<{ withFade?: boolean }>`
  position: relative;
  white-space: nowrap;

  ${ifProp(
    "withFade",
    css`
      :after {
        content: "";
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
        width: 16px;
        background: linear-gradient(to left, white, rgba(255, 255, 255, 0.001));
      }

      tr:hover &:after {
        background: linear-gradient(
          to left,
          ${Colors.TableRowHover},
          rgba(255, 255, 255, 0.001)
        );
      }
    `
  )}
`;
Td.defaultProps = {
  as: "td",
  fontSize: [15, 16],
  alignItems: "center",
  flexBasis: 0,
  py: [12, 12, 3],
  px: [12, 12, 3]
};

const EditContent = styled(Col)`
  border-bottom: 1px solid ${Colors.TableRowHover};
  background-color: #fafafa;
`;

const ActionBox = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const Action = (props: React.ComponentProps<typeof Icon>) => (
  <Icon
    as="button"
    py={0}
    px={0}
    mr={2}
    size={[23, 24]}
    flexShrink={0}
    p={["4px", "5px"]}
    stroke="#666"
    {...props}
  />
);

const ckActionFlex = {
  flexGrow: [0.5, 0.5, 0.2],
  flexShrink: [0.5, 0.5, 0.2],
  justifyContent: "flex-start"
};
const userEmailFlex = { flexGrow: [1, 3, 7], flexShrink: [1, 3, 7] };
const createdFlex = { flexGrow: [1, 1, 2.5], flexShrink: [1, 1, 2.5] };
const userRoleFlex = { flexGrow: [1, 1, 3], flexShrink: [1, 1, 3] };
const userLinksFlex = {
  flexGrow: [0.5, 0.5, 1],
  flexShrink: [0.5, 0.5, 1],
  justifyContent: "flex-end"
};
const actionsFlex = { flexGrow: [1, 1, 3], flexShrink: [1, 1, 3] };

interface RowProps {
  index: number;
  user: User;
  setDeleteModal: (number) => void;
  isSelected: boolean;
  setIsSelected: React.Dispatch<React.SetStateAction<boolean>>;
  reload: () => void;
}

interface EditForm {
  email: string;
  role: string;
  password: string;
  banned: boolean;
}

const Row: FC<RowProps> = ({
  index,
  user,
  setDeleteModal,
  isSelected,
  setIsSelected,
  reload
}) => {
  const isAdmin = useStoreState((s) => s.auth.isAdmin);
  const authEmail = useStoreState((s) => s.auth.email);
  const update = useStoreActions((s) => s.users.update);
  const [editFormState, { text, label, password, select }] =
    useFormState<EditForm>({
      email: user.email,
      role: user.role,
      password: "",
      banned: user.banned
    });
  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [banModal, setBanModal] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [banMessage, setBanMessage] = useMessage();
  const [unBanModal, setUnBanModal] = useState(false);
  const [unBanLoading, setUnBanLoading] = useState(false);
  const [unBanMessage, setUnBanMessage] = useMessage();
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useMessage();

  const onCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const onBan = async () => {
    setBanLoading(true);
    try {
      await update({
        id: user.id,
        banned: true
      });
      setBanMessage("User has been banned.", "green");
      reload();
    } catch (err) {
      setBanMessage(errorMessage(err));
    }
    setBanLoading(false);
  };

  const onUnBan = async () => {
    setUnBanLoading(true);
    try {
      await update({
        id: user.id,
        banned: false
      });
      setUnBanMessage("User has been unbanned.", "green");
      reload();
    } catch (err) {
      setUnBanMessage(errorMessage(err));
    }
    setUnBanLoading(false);
  };

  const onEdit = async () => {
    if (editLoading) return;
    setEditLoading(true);
    try {
      await update({
        id: user.id,
        password: editFormState.values.password,
        role: editFormState.values.role
      });
      setShowEdit(false);
      reload();
    } catch (err) {
      setEditMessage(errorMessage(err));
    }
    editFormState.setField("password", "");
    setEditLoading(false);
  };

  const toggleEdit = () => {
    setShowEdit((s) => !s);
    if (showEdit) editFormState.reset();
    setEditMessage("");
  };

  return (
    <>
      <Tr key={user.id}>
        <Td {...ckActionFlex} alignItems="flex-start">
          {/* {authEmail !== user.email && (
            <Checkbox
              label={""}
              name={""}
              checked={isSelected}
              onChange={() => setIsSelected(!isSelected)}
            />
          )} */}
        </Td>
        <Td {...userEmailFlex} withFade>
          {copied ? (
            <Animation
              minWidth={32}
              offset="10px"
              duration="0.2s"
              alignItems="center"
            >
              <Icon
                size={[23, 24]}
                py={0}
                px={0}
                mr={2}
                p="3px"
                name="check"
                strokeWidth="3"
                stroke={Colors.CheckIcon}
              />
            </Animation>
          ) : (
            <Animation minWidth={32} offset="-10px" duration="0.2s">
              <CopyToClipboard text={user.email} onCopy={onCopy}>
                <Action
                  name="copy"
                  strokeWidth="2.5"
                  stroke={Colors.CopyIcon}
                  backgroundColor={Colors.CopyIconBg}
                />
              </CopyToClipboard>
            </Animation>
          )}
          <ALink href="#">
            <Text>{user.email}</Text>
          </ALink>
        </Td>
        <Td {...createdFlex} flexDirection="column" alignItems="flex-start">
          <Text>{formatDistanceToNow(new Date(user.created_at))} ago</Text>
        </Td>
        <Td {...userRoleFlex} withFade>
          {user.role}
        </Td>
        <Td {...userLinksFlex}>{user.links || 0}</Td>
        <Td {...actionsFlex} justifyContent="flex-end">
          {user.banned && (
            <>
              <Tooltip id={`${index}-tooltip-banned`}>Banned</Tooltip>
              <Action
                as="span"
                data-tip
                data-for={`${index}-tooltip-banned`}
                name="stop"
                stroke="#bbb"
                strokeWidth="2.5"
                backgroundColor="none"
              />
            </>
          )}
          <Action
            name="editAlt"
            strokeWidth="2.5"
            stroke={Colors.EditIcon}
            backgroundColor={Colors.EditIconBg}
            onClick={toggleEdit}
          />
          {user.banned ? (
            <Action
              name="key"
              strokeWidth="2"
              stroke={user.email === authEmail ? "#bbb" : Colors.CheckIcon}
              backgroundColor={
                user.email === authEmail ? "none" : "hsl(144, 100%, 96%)"
              }
              onClick={() => setUnBanModal(true)}
              disabled={user.email === authEmail}
            />
          ) : (
            <Action
              name="stop"
              strokeWidth="2"
              stroke={user.email === authEmail ? "#bbb" : Colors.StopIcon}
              backgroundColor={
                user.email === authEmail ? "none" : Colors.StopIconBg
              }
              onClick={() => setBanModal(true)}
              disabled={user.email === authEmail}
            />
          )}
          <Action
            name="trash"
            strokeWidth="2.5"
            stroke={user.email === authEmail ? "#bbb" : Colors.TrashIcon}
            backgroundColor={
              user.email === authEmail ? "none" : Colors.TrashIconBg
            }
            onClick={() => setDeleteModal(index)}
            disabled={user.email === authEmail}
          />
        </Td>
      </Tr>
      {showEdit && (
        <EditContent as="tr">
          <Col
            as="td"
            alignItems="flex-start"
            px={[3, 3, 24]}
            py={[3, 3, 24]}
            width={1}
          >
            <Flex alignItems="flex-start" width={1}>
              <Col alignItems="flex-start" mr={3}>
                <Text
                  {...label("email")}
                  as="label"
                  mb={2}
                  fontSize={[14, 15]}
                  bold
                >
                  Email:
                </Text>
                <Flex as="form">
                  <TextInput
                    {...text("email")}
                    placeholder="Target..."
                    placeholderSize={[13, 14]}
                    fontSize={[14, 15]}
                    height={[40, 44]}
                    width={[1, 300, 420]}
                    pl={[3, 24]}
                    pr={[3, 24]}
                    required
                    readOnly
                  />
                </Flex>
              </Col>
              <Col alignItems="flex-start" mr={3}>
                <Text
                  {...label("role")}
                  as="label"
                  mb={2}
                  fontSize={[14, 15]}
                  bold
                >
                  Role
                </Text>
                <Flex as="form">
                  <Select
                    {...select("role")}
                    data-lpignore
                    pl={[3, 24]}
                    pr={[3, 24]}
                    fontSize={[14, 15]}
                    height={[40, 44]}
                    width={[1, 210, 240]}
                    options={[
                      { key: "user", value: "user" },
                      { key: "admin", value: "admin" }
                    ]}
                    disabled={user.email === authEmail}
                  />
                </Flex>
              </Col>
              <Col alignItems="flex-start">
                <Text
                  {...label("password")}
                  as="label"
                  mb={2}
                  fontSize={[14, 15]}
                  bold
                >
                  Password
                </Text>
                <Flex as="form">
                  <TextInput
                    {...password({
                      name: "password"
                    })}
                    placeholder={"••••••••"}
                    autocomplete="off"
                    data-lpignore
                    pl={[3, 24]}
                    pr={[3, 24]}
                    placeholderSize={[13, 14]}
                    fontSize={[14, 15]}
                    height={[40, 44]}
                    width={[1, 210, 240]}
                  />
                </Flex>
              </Col>
            </Flex>
            <Button
              color="blue"
              mt={3}
              height={[30, 38]}
              disabled={editLoading}
              onClick={onEdit}
            >
              <Icon
                name={editLoading ? "spinner" : "refresh"}
                stroke="white"
                mr={2}
              />
              {editLoading ? "Updating..." : "Update"}
            </Button>
            {editMessage.text && (
              <Text mt={3} fontSize={15} color={editMessage.color}>
                {editMessage.text}
              </Text>
            )}
          </Col>
        </EditContent>
      )}
      <Modal
        id="table-ban-modal"
        show={banModal}
        closeHandler={() => setBanModal(false)}
      >
        <>
          <H2 mb={24} textAlign="center" bold>
            Ban user?
          </H2>
          <Text mb={24} textAlign="center">
            Are you sure do you want to ban the user{" "}
            <Span bold>&quot;{user.email}&quot;</Span>?
          </Text>
          <Flex justifyContent="center" mt={4}>
            {banLoading ? (
              <>
                <Icon name="spinner" size={20} stroke={Colors.Spinner} />
              </>
            ) : banMessage.text ? (
              <Text fontSize={15} color={banMessage.color}>
                {banMessage.text}
              </Text>
            ) : (
              <>
                <Button color="gray" mr={3} onClick={() => setBanModal(false)}>
                  Cancel
                </Button>
                <Button color="red" ml={3} onClick={onBan}>
                  <Icon name="stop" stroke="white" mr={2} />
                  Ban
                </Button>
              </>
            )}
          </Flex>
        </>
      </Modal>
      <Modal
        id="table-unban-modal"
        show={unBanModal}
        closeHandler={() => setUnBanModal(false)}
      >
        <>
          <H2 mb={24} textAlign="center" bold>
            Unban user?
          </H2>
          <Text mb={24} textAlign="center">
            Are you sure do you want to unban the user{" "}
            <Span bold>&quot;{user.email}&quot;</Span>?
          </Text>
          <Flex justifyContent="center" mt={4}>
            {unBanLoading ? (
              <>
                <Icon name="spinner" size={20} stroke={Colors.Spinner} />
              </>
            ) : unBanMessage.text ? (
              <Text fontSize={15} color={unBanMessage.color}>
                {unBanMessage.text}
              </Text>
            ) : (
              <>
                <Button
                  color="gray"
                  mr={3}
                  onClick={() => setUnBanModal(false)}
                >
                  Cancel
                </Button>
                <Button color="blue" ml={3} onClick={onUnBan}>
                  <Icon name="key" stroke="white" mr={2} />
                  Unban
                </Button>
              </>
            )}
          </Flex>
        </>
      </Modal>
    </>
  );
};

interface Form {
  all: boolean;
  limit: string;
  skip: string;
  search: string;
}

const UsersTable: FC = () => {
  const isAdmin = useStoreState((s) => s.auth.isAdmin);
  const users = useStoreState((s) => s.users);
  const authEmail = useStoreState((s) => s.auth.email);
  const create = useStoreActions((s) => s.users.create);
  const { get, remove } = useStoreActions((s) => s.users);
  const [tableMessage, setTableMessage] = useState("No links to show.");
  const [deleteModal, setDeleteModal] = useState(-1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useMessage();
  const [formState, { label, text }] = useFormState<Form>(
    { skip: "0", limit: "10", all: false },
    { withIds: true }
  );

  const [createModal, setCreateModal] = useState(false);
  const [createFormState, { text: createText, select: createSelect }] =
    useFormState({
      email: "",
      password: "",
      passwordConfirm: "",
      role: "user"
    });
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormMessage, setCreateFormMessage] = useMessage();

  const onCreateUser = async () => {
    if (createLoading) return;

    if (!createFormState.values.email) {
      setCreateFormMessage("Email is required.");
      return;
    }

    if (
      !createFormState.values.email.match(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      )
    ) {
      setCreateFormMessage("Invalid email.");
      return;
    }

    if (!createFormState.values.password) {
      setCreateFormMessage("Password is required.");
      return;
    }

    if (
      createFormState.values.password !== createFormState.values.passwordConfirm
    ) {
      setCreateFormMessage("Passwords do not match.");
      return;
    }

    if (createFormState.values.password.length < 8) {
      setCreateFormMessage("Password must be at least 8 characters.");
      return;
    }

    setCreateLoading(true);
    setCreateFormMessage("");
    try {
      console.log("here");
      await create({
        email: createFormState.values.email,
        password: createFormState.values.password,
        role: createFormState.values.role
      });

      await get(options);

      setCreateModal(false);
      createFormState.reset();
      setCreateFormMessage("");
    } catch (err) {
      setCreateFormMessage(errorMessage(err));
    }
    setCreateLoading(false);
  };

  const onCloseCreateModal = () => {
    if (!createLoading) {
      setCreateModal(false);
      createFormState.reset();
      setCreateFormMessage("");
    }
  };

  const options = formState.values;
  const userToDelete = users.items[deleteModal];

  useEffect(() => {
    get(options).catch((err) =>
      setTableMessage(err?.response?.data?.error || "An error occurred.")
    );
  }, [options, get]);

  const onSubmit = (e) => {
    e.preventDefault();
    get(options);
  };

  const onDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(userToDelete.id);
      await get(options);
      setDeleteModal(-1);
    } catch (err) {
      setDeleteMessage(errorMessage(err));
    }
    setDeleteLoading(false);
  };

  const onDeleteSelected = async () => {
    try {
      setDeleteLoading(true);

      for (let i = 0; i < usersToDelete.length; i++) {
        await remove(usersToDelete[i].id);
      }

      await get(options);

      setUsersToDelete([]);
      setShowSelectedDeleteModal(false);
    } catch (err) {
      setDeleteMessage(errorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const onNavChange = (nextPage: number) => () => {
    formState.setField("skip", (parseInt(options.skip) + nextPage).toString());
  };

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<User[]>([]);

  const toggleSelectAllUsers = () => {
    setSelectAll(!selectAll);

    const updateSelectedUsers = users.items.map((user) => {
      return {
        ...user,
        isSelected: !selectAll
      };
    });

    setSelectedUsers(updateSelectedUsers.filter((u) => u.email !== authEmail));
  };

  const handleRowSelectionChange = (index: number, isSelected: boolean) => {
    const updatedSelectedUsers = [...selectedUsers];

    if (index >= 0 && index < updatedSelectedUsers.length) {
      updatedSelectedUsers[index] = {
        ...updatedSelectedUsers[index],
        isSelected
      };

      const allRowsSelected = updatedSelectedUsers.every(
        (user) => user.isSelected
      );

      setSelectAll(allRowsSelected);
    }

    setSelectedUsers(updatedSelectedUsers.filter((u) => u.email !== authEmail));
    setUsersToDelete(
      updatedSelectedUsers
        .filter((u) => u.email !== authEmail)
        .filter((v) => v.isSelected)
    );
  };

  const [showSelectedDeleteModal, setShowSelectedDeleteModal] =
    useState<boolean>(false);

  useEffect(() => {
    const updatedSelectedUsers = users.items.map((user) => {
      return {
        ...user,
        isSelected: selectAll
      };
    });

    setSelectedUsers(updatedSelectedUsers.filter((u) => u.email !== authEmail));
    setUsersToDelete(updatedSelectedUsers.filter((v) => v.isSelected));
  }, [users.items, selectAll, authEmail]);

  const Nav = (
    <Th
      alignItems="center"
      justifyContent="flex-end"
      flexGrow={1}
      flexShrink={1}
    >
      <Flex as="ul" m={0} p={0} style={{ listStyle: "none" }}>
        {["10", "25", "50"].map((c) => (
          <Flex key={c} ml={[10, 12]}>
            <NavButton
              disabled={options.limit === c}
              onClick={() => {
                formState.setField("limit", c);
                formState.setField("skip", "0");
              }}
            >
              {c}
            </NavButton>
          </Flex>
        ))}
      </Flex>
      <Flex
        width="1px"
        height={20}
        mx={[3, 24]}
        style={{ backgroundColor: "#ccc" }}
      />
      <Flex>
        <NavButton
          onClick={onNavChange(-parseInt(options.limit))}
          disabled={options.skip === "0"}
          px={2}
        >
          <Icon name="chevronLeft" size={15} />
        </NavButton>
        <NavButton
          onClick={onNavChange(parseInt(options.limit))}
          disabled={
            parseInt(options.skip) + parseInt(options.limit) > users.total
          }
          ml={12}
          px={2}
        >
          <Icon name="chevronRight" size={15} />
        </NavButton>
      </Flex>
    </Th>
  );

  return (
    <Col width={1200} maxWidth="95%" margin="40px 0 120px" my={4}>
      <ActionBox mb={4}>
        <H2 light>Users</H2>
        {isAdmin && (
          <NavButton height={33} onClick={() => setCreateModal(true)}>
            Add User <Icon name="plus" stroke="black" ml={2} />
          </NavButton>
        )}
      </ActionBox>
      <Table scrollWidth="1000px">
        <thead>
          <Tr justifyContent="space-between">
            <Th flexGrow={1} flexShrink={1}>
              <Flex as="form" onSubmit={onSubmit}>
                <TextInput
                  {...text("search")}
                  placeholder="Search..."
                  height={[30, 32]}
                  placeholderSize={[13, 13, 13, 13]}
                  fontSize={[14]}
                  pl={12}
                  pr={12}
                  width={[1]}
                  br="3px"
                  bbw="2px"
                />
              </Flex>

              <Flex mx={[4]}>
                {selectedUsers.filter((v) => v.isSelected).length > 0 && (
                  <NavButton
                    height={33}
                    onClick={() => setShowSelectedDeleteModal(true)}
                  >
                    Delete Selected (
                    {selectedUsers.filter((v) => v.isSelected).length})
                  </NavButton>
                )}
              </Flex>
            </Th>
            {Nav}
          </Tr>
          <Tr>
            <Th {...ckActionFlex}>
              {/* <Checkbox
                name={"Select All"}
                label={""}
                checked={selectAll}
                onChange={toggleSelectAllUsers}
              /> */}
            </Th>
            <Th {...userEmailFlex}>Email</Th>
            <Th {...createdFlex}>Created</Th>
            <Th {...userRoleFlex}>Role</Th>
            <Th {...userLinksFlex}>Links</Th>
            <Th {...actionsFlex}></Th>
          </Tr>
        </thead>
        <tbody style={{ opacity: users.loading ? 0.4 : 1 }}>
          {!users.items.length ? (
            <Tr width={1} justifyContent="center">
              <Td flex="1 1 auto" justifyContent="center">
                <Text fontSize={18} light>
                  {users.loading ? "Loading users..." : tableMessage}
                </Text>
              </Td>
            </Tr>
          ) : (
            <>
              {users.items.map((user, index) => (
                <Row
                  setDeleteModal={setDeleteModal}
                  index={index}
                  user={user}
                  key={user.id}
                  isSelected={selectedUsers[index]?.isSelected || false}
                  setIsSelected={(isSelected: boolean) =>
                    handleRowSelectionChange(index, isSelected)
                  }
                  reload={() => get(options)}
                />
              ))}
            </>
          )}
        </tbody>
        <tfoot>
          <Tr justifyContent="flex-end">{Nav}</Tr>
        </tfoot>
      </Table>
      <Modal
        id="delete-custom-domain"
        show={deleteModal > -1}
        closeHandler={() => setDeleteModal(-1)}
      >
        {userToDelete && (
          <>
            <H2 mb={24} textAlign="center" bold>
              Delete user?
            </H2>
            <Text textAlign="center">
              Are you sure do you want to delete the user{" "}
              <Span bold>&quot;{userToDelete.email}&quot;</Span>?
            </Text>
            <Flex justifyContent="center" mt={44}>
              {deleteLoading ? (
                <>
                  <Icon name="spinner" size={20} stroke={Colors.Spinner} />
                </>
              ) : deleteMessage.text ? (
                <Text fontSize={15} color={deleteMessage.color}>
                  {deleteMessage.text}
                </Text>
              ) : (
                <>
                  <Button
                    color="gray"
                    mr={3}
                    onClick={() => setDeleteModal(-1)}
                  >
                    Cancel
                  </Button>
                  <Button color="red" ml={3} onClick={onDelete}>
                    <Icon name="trash" stroke="white" mr={2} />
                    Delete
                  </Button>
                </>
              )}
            </Flex>
          </>
        )}
      </Modal>
      <Modal
        id="delete-selected-domain"
        show={showSelectedDeleteModal}
        closeHandler={() => {
          if (!deleteLoading) {
            setShowSelectedDeleteModal(false);
          }
        }}
      >
        {usersToDelete.length > 0 && (
          <>
            <H2 mb={24} textAlign="center" bold>
              Delete all selected users?
            </H2>
            <Text textAlign="center">
              Are you sure you want to delete the selected users?
            </Text>
            <Flex justifyContent="center" mt={44}>
              {deleteLoading ? (
                <>
                  <Icon name="spinner" size={20} stroke={Colors.Spinner} />
                </>
              ) : deleteMessage.text ? (
                <Text fontSize={15} color={deleteMessage.color}>
                  {deleteMessage.text}
                </Text>
              ) : (
                <>
                  <Button
                    color="gray"
                    mr={3}
                    onClick={() => setShowSelectedDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button color="red" ml={3} onClick={onDeleteSelected}>
                    <Icon name="trash" stroke="white" mr={2} />
                    Delete
                  </Button>
                </>
              )}
            </Flex>
          </>
        )}
      </Modal>
      <Modal
        id="create-user-modal"
        show={createModal}
        closeHandler={onCloseCreateModal}
      >
        <H2 mb={24} textAlign="center" bold>
          Add User
        </H2>
        <Col mt={4}>
          <Flex alignItems="center" justifyContent="center">
            <Col width={1}>
              <Text
                {...label("email")}
                as="label"
                mb={2}
                fontSize={[14, 15]}
                bold
              >
                Email:
              </Text>
              <Flex as="form">
                <TextInput
                  {...createText("email")}
                  placeholder="example@user.com"
                  placeholderSize={[13, 14]}
                  fontSize={[14, 15]}
                  height={[40, 44]}
                  width={[1, 300, 300]}
                  pl={[3, 24]}
                  pr={[3, 24]}
                  required
                  readOnly={createLoading}
                />
              </Flex>
            </Col>
            <Col width={1} ml={4}>
              <Text
                {...label("role")}
                as="label"
                mb={2}
                fontSize={[14, 15]}
                bold
              >
                Role
              </Text>
              <Flex as="div">
                <Select
                  {...createSelect("role")}
                  data-lpignore
                  pl={[3, 24]}
                  pr={[3, 24]}
                  fontSize={[14, 15]}
                  height={[40, 44]}
                  width={[1, 300, 300]}
                  options={[
                    { key: "user", value: "user" },
                    { key: "admin", value: "admin" }
                  ]}
                  disabled={createLoading}
                />
              </Flex>
            </Col>
          </Flex>
          <Flex alignItems="center" justifyContent="center" mt={4}>
            <Col width={1}>
              <Text
                {...label("password")}
                as="label"
                mb={2}
                fontSize={[14, 15]}
                bold
              >
                Password
              </Text>
              <Flex as="div">
                <TextInput
                  {...createText("password")}
                  placeholder={"••••••••"}
                  type="password"
                  autocomplete="off"
                  data-lpignore
                  pl={[3, 24]}
                  pr={[3, 24]}
                  placeholderSize={[13, 14]}
                  fontSize={[14, 15]}
                  height={[40, 44]}
                  width={[1, 300, 300]}
                  readOnly={createLoading}
                />
              </Flex>
            </Col>
            <Col width={1} ml={4}>
              <Text
                {...label("confirm-password")}
                as="label"
                mb={2}
                fontSize={[14, 15]}
                bold
              >
                Confirm Password
              </Text>
              <Flex as="div">
                <TextInput
                  {...createText("passwordConfirm")}
                  placeholder={"••••••••"}
                  type="password"
                  autocomplete="off"
                  data-lpignore
                  pl={[3, 24]}
                  pr={[3, 24]}
                  placeholderSize={[13, 14]}
                  fontSize={[14, 15]}
                  height={[40, 44]}
                  width={[1, 300, 300]}
                  readOnly={createLoading}
                />
              </Flex>
            </Col>
          </Flex>
        </Col>
        {createFormMessage.text && (
          <Flex justifyContent="center" mt={3}>
            <Text fontSize={15} color={createFormMessage.color}>
              {createFormMessage.text}
            </Text>
          </Flex>
        )}
        <Flex justifyContent="center" mt={44}>
          <Button
            color="gray"
            mr={3}
            onClick={onCloseCreateModal}
            disabled={createLoading}
          >
            Cancel
          </Button>
          <Button color="blue" ml={3} onClick={onCreateUser}>
            <Icon
              name={createLoading ? "spinner" : "plus"}
              stroke="white"
              mr={2}
            />
            {createLoading ? "Creating..." : "Create"}
          </Button>
        </Flex>
      </Modal>
    </Col>
  );
};

export default UsersTable;
